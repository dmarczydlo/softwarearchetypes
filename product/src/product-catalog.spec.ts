import { describe, it, expect, beforeEach } from "vitest";
import { ProductConfiguration } from "./product-configuration";
import { ProductCatalog } from "./product-catalog";
import { ProductTypeRepository } from "./product-type-repository";
import { ProductType } from "./product-type";
import { UuidProductIdentifier } from "./product-identifier";
import { ProductName } from "./product-name";
import { ProductDescription } from "./product-description";
import { CatalogEntryId } from "./catalog-entry-id";
import { AddToOffer, DiscontinueProduct, UpdateMetadata } from "./product-commands";
import { SearchCatalogCriteria, FindCatalogEntryCriteria, FindByCategoryCriteria, FindAvailableAtCriteria, FindByMetadataCriteria } from "./product-queries";

describe("ProductCatalog", () => {
    let configuration: ProductConfiguration;
    let catalog: ProductCatalog;
    let productTypeRepository: ProductTypeRepository;

    beforeEach(() => {
        configuration = ProductConfiguration.inMemory();
        catalog = configuration.productCatalog();
        productTypeRepository = configuration.productTypeRepository();
    });

    function thereIsProduct(name: string): ProductType {
        const pt = ProductType.define(UuidProductIdentifier.random(), ProductName.of(name), ProductDescription.of("Description of " + name));
        productTypeRepository.save(pt);
        return pt;
    }

    function thereIsCatalogEntry(product: ProductType, displayName: string, categories: Set<string>): CatalogEntryId {
        const result = catalog.handleAddToOffer(new AddToOffer(product.id().toString(), displayName, "Description of " + displayName, categories, null, null, {}));
        return result.getSuccess();
    }

    function thereIsCatalogEntryWithValidity(product: ProductType, displayName: string, from: string | null, to: string | null): CatalogEntryId {
        const result = catalog.handleAddToOffer(new AddToOffer(product.id().toString(), displayName, "Description of " + displayName, new Set(), from, to, {}));
        return result.getSuccess();
    }

    function thereIsCatalogEntryWithMetadata(product: ProductType, displayName: string, metadata: Record<string, string>): CatalogEntryId {
        const result = catalog.handleAddToOffer(new AddToOffer(product.id().toString(), displayName, "Description of " + displayName, new Set(), null, null, metadata));
        return result.getSuccess();
    }

    it("should add product to offer and find it by id", () => {
        const laptop = thereIsProduct("Business Laptop");
        const result = catalog.handleAddToOffer(new AddToOffer(laptop.id().toString(), "Premium Laptop", "High-end business laptop", new Set(["electronics"]), null, null, {}));

        expect(result.isSuccess()).toBe(true);
        const found = catalog.findByCatalogEntryId(new FindCatalogEntryCriteria(result.getSuccess().value))!;
        expect(found.displayName).toBe("Premium Laptop");
        expect(found.productTypeId).toBe(laptop.id().toString());
    });

    it("should fail to add non-existent product to offer", () => {
        const nonExistent = UuidProductIdentifier.random();
        const result = catalog.handleAddToOffer(new AddToOffer(nonExistent.toString(), "Ghost Product", "Does not exist", new Set(), null, null, {}));
        expect(result.isFailure()).toBe(true);
        expect(result.getFailure()).toContain("not found");
    });

    it("should find products by category", () => {
        const laptop = thereIsProduct("Laptop");
        const phone = thereIsProduct("Phone");
        thereIsCatalogEntry(laptop, "Gaming Laptop", new Set(["electronics", "gaming"]));
        thereIsCatalogEntry(phone, "Smartphone", new Set(["electronics", "phones"]));

        expect(catalog.findByCategory(new FindByCategoryCriteria("electronics")).size).toBe(2);
        expect(catalog.findByCategory(new FindByCategoryCriteria("gaming")).size).toBe(1);
        expect(catalog.findByCategory(new FindByCategoryCriteria("phones")).size).toBe(1);
    });

    it("should find products available at date", () => {
        const laptop = thereIsProduct("Laptop");
        const phone = thereIsProduct("Phone");
        thereIsCatalogEntryWithValidity(laptop, "2024 Laptop", "2024-01-01", "2024-12-31");
        thereIsCatalogEntryWithValidity(phone, "Always Phone", null, null);

        expect(catalog.findByAvailableAt(new FindAvailableAtCriteria("2024-06-15")).size).toBe(2);
        expect(catalog.findByAvailableAt(new FindAvailableAtCriteria("2025-06-15")).size).toBe(1);
    });

    it("should not find discontinued products", () => {
        const laptop = thereIsProduct("Laptop");
        const entryId = thereIsCatalogEntryWithValidity(laptop, "Old Laptop", "2020-01-01", null);
        catalog.handleDiscontinueProduct(new DiscontinueProduct(entryId.value, "2023-12-31"));

        expect(catalog.findByAvailableAt(new FindAvailableAtCriteria("2024-06-15")).size).toBe(0);
        expect(catalog.findByAvailableAt(new FindAvailableAtCriteria("2023-06-15")).size).toBe(1);
    });

    it("should find products by metadata key and value", () => {
        const laptop = thereIsProduct("Laptop");
        const phone = thereIsProduct("Phone");
        thereIsCatalogEntryWithMetadata(laptop, "Featured Laptop", { featured: "true", brand: "Dell" });
        thereIsCatalogEntryWithMetadata(phone, "Regular Phone", { featured: "false", brand: "Samsung" });

        expect(catalog.findByMetadata(new FindByMetadataCriteria("featured", "true")).size).toBe(1);
        expect(catalog.findByMetadata(new FindByMetadataCriteria("brand", "Dell")).size).toBe(1);
    });

    it("should search by text in display name", () => {
        const laptop = thereIsProduct("Laptop");
        const phone = thereIsProduct("Phone");
        thereIsCatalogEntry(laptop, "Gaming Laptop Pro", new Set());
        thereIsCatalogEntry(phone, "Budget Smartphone", new Set());

        expect(catalog.findBySearch(SearchCatalogCriteria.byText("Laptop")).size).toBe(1);
        expect(catalog.findBySearch(SearchCatalogCriteria.byText("Smartphone")).size).toBe(1);
    });

    it("should search by text case insensitive", () => {
        const laptop = thereIsProduct("Laptop");
        thereIsCatalogEntry(laptop, "Gaming Laptop", new Set());

        expect(catalog.findBySearch(SearchCatalogCriteria.byText("GAMING")).size).toBe(1);
        expect(catalog.findBySearch(SearchCatalogCriteria.byText("gaming")).size).toBe(1);
    });

    it("should return all entries when no filters", () => {
        const laptop = thereIsProduct("Laptop");
        const phone = thereIsProduct("Phone");
        thereIsCatalogEntry(laptop, "Laptop", new Set());
        thereIsCatalogEntry(phone, "Phone", new Set());

        expect(catalog.findBySearch(SearchCatalogCriteria.all()).size).toBe(2);
    });

    it("should discontinue product", () => {
        const laptop = thereIsProduct("Laptop");
        const entryId = thereIsCatalogEntryWithValidity(laptop, "Old Laptop", "2020-01-01", null);

        const result = catalog.handleDiscontinueProduct(new DiscontinueProduct(entryId.value, "2024-06-30"));

        expect(result.isSuccess()).toBe(true);
        const updated = catalog.findByCatalogEntryId(new FindCatalogEntryCriteria(entryId.value))!;
        expect(updated.availableUntil).toBe("2024-06-30");
    });

    it("should update metadata", () => {
        const laptop = thereIsProduct("Laptop");
        const entryId = thereIsCatalogEntryWithMetadata(laptop, "Laptop", { featured: "false" });

        const result = catalog.handleUpdateMetadata(new UpdateMetadata(entryId.value, { featured: "true", badge: "sale" }));

        expect(result.isSuccess()).toBe(true);
        const updated = catalog.findByCatalogEntryId(new FindCatalogEntryCriteria(entryId.value))!;
        expect(updated.metadata.get("featured")).toBe("true");
        expect(updated.metadata.get("badge")).toBe("sale");
    });
});
