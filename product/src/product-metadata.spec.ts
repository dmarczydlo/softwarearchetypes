import { describe, it, expect } from "vitest";
import { Unit } from "@softwarearchetypes/quantity";
import { ProductMetadata } from "./product-metadata";
import { ProductType } from "./product-type";
import { UuidProductIdentifier } from "./product-identifier";
import { ProductName } from "./product-name";
import { ProductDescription } from "./product-description";
import { ProductTrackingStrategy } from "./product-tracking-strategy";

describe("ProductMetadata", () => {
    it("should create empty metadata", () => {
        const metadata = ProductMetadata.empty();
        expect(metadata.asMap().size).toBe(0);
        expect(metadata.has("category")).toBe(false);
    });

    it("should create metadata from map", () => {
        const metadata = ProductMetadata.of({ category: "coffee", seasonal: "false", brand: "Starbucks" });
        expect(metadata.has("category")).toBe(true);
        expect(metadata.get("category")).toBe("coffee");
        expect(metadata.get("seasonal")).toBe("false");
        expect(metadata.get("brand")).toBe("Starbucks");
    });

    it("should add metadata immutably", () => {
        const m1 = ProductMetadata.empty();
        const m2 = m1.with("category", "coffee");
        const m3 = m2.with("seasonal", "true");

        expect(m1.has("category")).toBe(false);
        expect(m2.has("category")).toBe(true);
        expect(m2.has("seasonal")).toBe(false);
        expect(m3.has("category")).toBe(true);
        expect(m3.has("seasonal")).toBe(true);
    });

    it("should get with default", () => {
        const metadata = ProductMetadata.of({ category: "coffee" });
        expect(metadata.getOrDefault("category", "unknown")).toBe("coffee");
        expect(metadata.getOrDefault("brand", "unknown")).toBe("unknown");
    });

    it("should use metadata in ProductType", () => {
        const productType = ProductType.builder(
            UuidProductIdentifier.random(),
            ProductName.of("Pumpkin Spice Latte"),
            ProductDescription.of("Seasonal coffee"),
            Unit.pieces(),
            ProductTrackingStrategy.IDENTICAL,
        )
        .withMetadata("category", "coffee")
        .withMetadata("seasonal", "true")
        .withMetadata("season", "autumn")
        .build();

        expect(productType.metadata().get("category")).toBe("coffee");
        expect(productType.metadata().get("seasonal")).toBe("true");
        expect(productType.metadata().get("season")).toBe("autumn");
    });
});
