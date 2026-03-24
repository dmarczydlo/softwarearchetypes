import { Result, ResultFactory } from "@softwarearchetypes/common";
import { CatalogEntryId } from "./catalog-entry-id";
import { CatalogEntry } from "./catalog-entry";
import { CatalogEntryRepository, InMemoryCatalogEntryRepository } from "./catalog-entry-repository";
import { ProductTypeRepository } from "./product-type-repository";
import { ProductType } from "./product-type";
import { Validity } from "./validity";
import { CatalogEntryView } from "./product-views";
import { AddToOffer, DiscontinueProduct, UpdateMetadata } from "./product-commands";
import { SearchCatalogCriteria, FindCatalogEntryCriteria, FindByCategoryCriteria, FindAvailableAtCriteria, FindByMetadataCriteria } from "./product-queries";

export class ProductCatalog {

    private readonly catalogRepository: CatalogEntryRepository;
    private readonly productTypeRepository: ProductTypeRepository;

    constructor(catalogRepository: CatalogEntryRepository, productTypeRepository: ProductTypeRepository) {
        this.catalogRepository = catalogRepository;
        this.productTypeRepository = productTypeRepository;
    }

    static create(productTypeRepository: ProductTypeRepository): ProductCatalog {
        return new ProductCatalog(new InMemoryCatalogEntryRepository(), productTypeRepository);
    }

    handleAddToOffer(command: AddToOffer): Result<string, CatalogEntryId> {
        try {
            const productType = this.productTypeRepository.findByIdValue(command.productTypeId);
            if (productType == null) throw new Error("ProductType not found: " + command.productTypeId);

            const validity = this.buildValidity(command.availableFrom, command.availableUntil);
            const catalogEntryId = CatalogEntryId.generate();

            const catalogEntry = CatalogEntry.builder()
                .id(catalogEntryId)
                .displayName(command.displayName)
                .description(command.description)
                .product(productType)
                .categories(command.categories)
                .validity(validity)
                .metadata(command.metadata)
                .build();

            this.catalogRepository.save(catalogEntry);
            return ResultFactory.success(catalogEntryId);
        } catch (e) {
            return ResultFactory.failure((e as Error).message);
        }
    }

    handleDiscontinueProduct(command: DiscontinueProduct): Result<string, CatalogEntryId> {
        try {
            const catalogEntryId = CatalogEntryId.of(command.catalogEntryId);
            const catalogEntry = this.catalogRepository.findById(catalogEntryId);
            if (catalogEntry == null) throw new Error("Catalog entry not found: " + command.catalogEntryId);

            const newValidity = catalogEntry.validity().from() != null
                ? Validity.between(catalogEntry.validity().from()!, command.discontinuationDate)
                : Validity.until(command.discontinuationDate);

            const updated = catalogEntry.withValidity(newValidity);
            this.catalogRepository.save(updated);
            return ResultFactory.success(catalogEntryId);
        } catch (e) {
            return ResultFactory.failure((e as Error).message);
        }
    }

    handleUpdateMetadata(command: UpdateMetadata): Result<string, CatalogEntryId> {
        try {
            const catalogEntryId = CatalogEntryId.of(command.catalogEntryId);
            const catalogEntry = this.catalogRepository.findById(catalogEntryId);
            if (catalogEntry == null) throw new Error("Catalog entry not found: " + command.catalogEntryId);

            const updated = catalogEntry.withMetadata(new Map(Object.entries(command.metadata)));
            this.catalogRepository.save(updated);
            return ResultFactory.success(catalogEntryId);
        } catch (e) {
            return ResultFactory.failure((e as Error).message);
        }
    }

    findBySearch(criteria: SearchCatalogCriteria): Set<CatalogEntryView> {
        const entries = this.catalogRepository.findAll();
        const result = new Set<CatalogEntryView>();
        for (const entry of entries) {
            if (this.matchesSearchText(entry, criteria.searchText)
                && this.matchesCategories(entry, criteria.categories)
                && this.matchesAvailability(entry, criteria.availableAt)
                && this.matchesProductType(entry, criteria.productTypeId)
                && this.matchesFeatures(entry, criteria.productTypeFeatures)) {
                result.add(this.toCatalogEntryView(entry));
            }
        }
        return result;
    }

    findByCatalogEntryId(criteria: FindCatalogEntryCriteria): CatalogEntryView | null {
        const catalogEntryId = CatalogEntryId.of(criteria.catalogEntryId);
        const entry = this.catalogRepository.findById(catalogEntryId);
        return entry ? this.toCatalogEntryView(entry) : null;
    }

    findByCategory(criteria: FindByCategoryCriteria): Set<CatalogEntryView> {
        const result = new Set<CatalogEntryView>();
        for (const entry of this.catalogRepository.findByCategory(criteria.category)) {
            result.add(this.toCatalogEntryView(entry));
        }
        return result;
    }

    findByAvailableAt(criteria: FindAvailableAtCriteria): Set<CatalogEntryView> {
        const result = new Set<CatalogEntryView>();
        for (const entry of this.catalogRepository.findAll()) {
            if (entry.isAvailableAt(criteria.date)) {
                result.add(this.toCatalogEntryView(entry));
            }
        }
        return result;
    }

    findByMetadata(criteria: FindByMetadataCriteria): Set<CatalogEntryView> {
        const result = new Set<CatalogEntryView>();
        for (const entry of this.catalogRepository.findAll()) {
            if (this.matchesMetadata(entry, criteria.key, criteria.value)) {
                result.add(this.toCatalogEntryView(entry));
            }
        }
        return result;
    }

    private matchesSearchText(entry: CatalogEntry, searchText: string | null): boolean {
        if (searchText == null || searchText.trim().length === 0) return true;
        const lower = searchText.toLowerCase();
        return entry.displayName().toLowerCase().includes(lower) || entry.description().toLowerCase().includes(lower);
    }

    private matchesCategories(entry: CatalogEntry, categories: Set<string> | null): boolean {
        if (categories == null || categories.size === 0) return true;
        for (const cat of categories) {
            if (entry.isInCategory(cat)) return true;
        }
        return false;
    }

    private matchesAvailability(entry: CatalogEntry, date: string | null): boolean {
        if (date == null) return true;
        return entry.isAvailableAt(date);
    }

    private matchesProductType(entry: CatalogEntry, productTypeId: string | null): boolean {
        if (productTypeId == null || productTypeId.trim().length === 0) return true;
        return entry.product().id().toString() === productTypeId;
    }

    private matchesFeatures(entry: CatalogEntry, features: Map<string, Set<string>> | null): boolean {
        if (features == null || features.size === 0) return true;
        const product = entry.product();
        if (!(product instanceof ProductType)) return false;

        const allFeatures = new Set([...product.featureTypes().mandatoryFeatures(), ...product.featureTypes().optionalFeatures()]);

        for (const [featureName, requestedValues] of features) {
            let found = false;
            for (const f of allFeatures) {
                if (f.name() === featureName) { found = true; break; }
            }
            if (!found) return false;

            const featureType = Array.from(allFeatures).find(f => f.name() === featureName)!;
            let anyMatch = false;
            for (const value of requestedValues) {
                if (featureType.isValidValue(value)) { anyMatch = true; break; }
            }
            if (!anyMatch) return false;
        }
        return true;
    }

    private matchesMetadata(entry: CatalogEntry, key: string, value: string | null): boolean {
        if (value == null) return entry.hasMetadata(key);
        return value === entry.getMetadata(key);
    }

    private buildValidity(from: string | null, to: string | null): Validity {
        if (from != null && to != null) return Validity.between(from, to);
        if (from != null) return Validity.from(from);
        if (to != null) return Validity.until(to);
        return Validity.always();
    }

    private toCatalogEntryView(entry: CatalogEntry): CatalogEntryView {
        return {
            catalogEntryId: entry.id().value,
            displayName: entry.displayName(),
            description: entry.description(),
            productTypeId: entry.product().id().toString(),
            categories: entry.categories(),
            availableFrom: entry.validity().from(),
            availableUntil: entry.validity().to(),
            metadata: entry.metadata(),
        };
    }
}
