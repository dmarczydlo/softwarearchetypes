import { CatalogEntryId } from "./catalog-entry-id";
import { CatalogEntry } from "./catalog-entry";
import { ProductIdentifier } from "./product-identifier";

export interface CatalogEntryRepository {
    save(entry: CatalogEntry): void;
    findById(id: CatalogEntryId): CatalogEntry | null;
    findAll(): Set<CatalogEntry>;
    findByProductType(productTypeId: ProductIdentifier): Set<CatalogEntry>;
    findByCategory(category: string): Set<CatalogEntry>;
    remove(id: CatalogEntryId): void;
}

export class InMemoryCatalogEntryRepository implements CatalogEntryRepository {
    private readonly storage: Map<string, CatalogEntry> = new Map();

    save(entry: CatalogEntry): void {
        this.storage.set(entry.id().value, entry);
    }

    findById(id: CatalogEntryId): CatalogEntry | null {
        return this.storage.get(id.value) ?? null;
    }

    findAll(): Set<CatalogEntry> {
        return new Set(this.storage.values());
    }

    findByProductType(productTypeId: ProductIdentifier): Set<CatalogEntry> {
        const result = new Set<CatalogEntry>();
        for (const entry of this.storage.values()) {
            if (entry.product().id().toString() === productTypeId.toString()) result.add(entry);
        }
        return result;
    }

    findByCategory(category: string): Set<CatalogEntry> {
        const result = new Set<CatalogEntry>();
        for (const entry of this.storage.values()) {
            if (entry.isInCategory(category)) result.add(entry);
        }
        return result;
    }

    remove(id: CatalogEntryId): void {
        this.storage.delete(id.value);
    }
}
