import { describe, it, expect, beforeEach } from "vitest";
import { ProductConfiguration } from "./product-configuration";
import { ProductFacade } from "./product-facade";
import { DefineProductType, MandatoryFeature, OptionalFeature, AllowedValuesConfig, NumericRangeConfig, UnconstrainedConfig } from "./product-commands";
import { FindProductTypeCriteria, FindByTrackingStrategyCriteria } from "./product-queries";
import { randomUUID } from "crypto";

describe("ProductFacade", () => {
    let configuration: ProductConfiguration;
    let facade: ProductFacade;

    beforeEach(() => {
        configuration = ProductConfiguration.inMemory();
        facade = configuration.productFacade();
    });

    it("should define simple product type and find it", () => {
        const productId = randomUUID();

        const result = facade.handleDefineProductType(new DefineProductType(
            "UUID", productId, "Simple Product", "A simple product without features",
            "pcs", "IDENTICAL", new Set(), new Set(), {}
        ));

        expect(result.isSuccess()).toBe(true);
        const found = facade.findByProductId(new FindProductTypeCriteria(productId));
        expect(found).toBeDefined();
        expect(found!.name).toBe("Simple Product");
        expect(found!.trackingStrategy).toBe("IDENTICAL");
    });

    it("should define product type with mandatory features", () => {
        const productId = randomUUID();

        const result = facade.handleDefineProductType(new DefineProductType(
            "UUID", productId, "Laptop", "Business laptop with configurable features",
            "pcs", "INDIVIDUALLY_TRACKED",
            new Set([
                new MandatoryFeature("color", new AllowedValuesConfig(new Set(["Black", "Silver", "Gold"]))),
                new MandatoryFeature("storage", new AllowedValuesConfig(new Set(["256GB", "512GB", "1TB"]))),
            ]),
            new Set(),
            { category: "electronics" },
        ));

        expect(result.isSuccess()).toBe(true);
        const found = facade.findByProductId(new FindProductTypeCriteria(productId));
        expect(found!.mandatoryFeatures.size).toBe(2);
    });

    it("should define product type with optional features", () => {
        const productId = randomUUID();

        const result = facade.handleDefineProductType(new DefineProductType(
            "UUID", productId, "Smartphone", "Smartphone with optional features",
            "pcs", "INDIVIDUALLY_TRACKED",
            new Set(),
            new Set([
                new OptionalFeature("engraving", new UnconstrainedConfig("TEXT")),
                new OptionalFeature("warranty_years", new NumericRangeConfig(1, 5)),
            ]),
            {},
        ));

        expect(result.isSuccess()).toBe(true);
        const found = facade.findByProductId(new FindProductTypeCriteria(productId));
        expect(found!.optionalFeatures.size).toBe(2);
    });

    it("should fail for invalid identifier type", () => {
        const result = facade.handleDefineProductType(new DefineProductType(
            "INVALID_TYPE", "some-id", "Product", "Description",
            "pcs", "IDENTICAL", new Set(), new Set(), {}
        ));

        expect(result.isFailure()).toBe(true);
        expect(result.getFailure()).toContain("Unknown product identifier type");
    });

    it("should find product types by tracking strategy", () => {
        thereIsProductType("Identical Product 1", "IDENTICAL");
        thereIsProductType("Tracked Product", "INDIVIDUALLY_TRACKED");
        thereIsProductType("Identical Product 2", "IDENTICAL");

        const identical = facade.findByTrackingStrategy(new FindByTrackingStrategyCriteria("IDENTICAL"));
        const tracked = facade.findByTrackingStrategy(new FindByTrackingStrategyCriteria("INDIVIDUALLY_TRACKED"));

        expect(identical.size).toBe(2);
        expect(tracked.size).toBe(1);
    });

    it("should return null for non-existent product", () => {
        const found = facade.findByProductId(new FindProductTypeCriteria(randomUUID()));
        expect(found).toBeNull();
    });

    it("should return correct feature type views", () => {
        const productId = randomUUID();
        facade.handleDefineProductType(new DefineProductType(
            "UUID", productId, "Product with Features", "Description",
            "pcs", "IDENTICAL",
            new Set([new MandatoryFeature("color", new AllowedValuesConfig(new Set(["Red", "Blue"])))]),
            new Set([new OptionalFeature("size", new NumericRangeConfig(1, 10))]),
            {},
        ));

        const view = facade.findByProductId(new FindProductTypeCriteria(productId))!;
        expect(view.mandatoryFeatures.size).toBe(1);
        expect(view.optionalFeatures.size).toBe(1);

        const colorFeature = Array.from(view.mandatoryFeatures).find(f => f.name === "color")!;
        expect(colorFeature.valueType).toBe("TEXT");
        expect(colorFeature.constraintType).toBe("ALLOWED_VALUES");
        expect(colorFeature.constraintConfig).toHaveProperty("allowedValues");

        const sizeFeature = Array.from(view.optionalFeatures).find(f => f.name === "size")!;
        expect(sizeFeature.valueType).toBe("INTEGER");
        expect(sizeFeature.constraintType).toBe("NUMERIC_RANGE");
        expect(sizeFeature.constraintConfig["min"]).toBe(1);
        expect(sizeFeature.constraintConfig["max"]).toBe(10);
    });

    it("should reject null product ID type", () => {
        expect(() => new DefineProductType(
            null as unknown as string, "id", "Name", "Description", "pcs", "IDENTICAL", new Set(), new Set(), {}
        )).toThrow();
    });

    it("should reject blank product ID", () => {
        expect(() => new DefineProductType(
            "UUID", "   ", "Name", "Description", "pcs", "IDENTICAL", new Set(), new Set(), {}
        )).toThrow();
    });

    it("should reject blank name", () => {
        expect(() => new DefineProductType(
            "UUID", randomUUID(), "", "Description", "pcs", "IDENTICAL", new Set(), new Set(), {}
        )).toThrow();
    });

    function thereIsProductType(name: string, trackingStrategy: string): void {
        facade.handleDefineProductType(new DefineProductType(
            "UUID", randomUUID(), name, "Description of " + name,
            "pcs", trackingStrategy, new Set(), new Set(), {}
        ));
    }
});
