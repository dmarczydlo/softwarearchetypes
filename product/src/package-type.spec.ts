import { describe, it, expect, beforeEach } from "vitest";
import { Unit } from "@softwarearchetypes/quantity";
import { ProductType } from "./product-type";
import { PackageType } from "./package-type";
import { ProductBuilder } from "./product-builder";
import { UuidProductIdentifier } from "./product-identifier";
import { ProductName } from "./product-name";
import { ProductDescription } from "./product-description";
import { ProductTrackingStrategy } from "./product-tracking-strategy";
import { SelectedProduct } from "./selected-product";
import { ProductSet } from "./product-set";
import { SelectionRuleFactory } from "./selection-rule";

describe("PackageType", () => {
    let laptop: ProductType;
    let mouse: ProductType;
    let keyboard: ProductType;
    let monitor: ProductType;
    let warranty: ProductType;
    let insurance: ProductType;

    beforeEach(() => {
        laptop = new ProductBuilder(UuidProductIdentifier.random(), ProductName.of("Business Laptop"), ProductDescription.of("Professional laptop"))
            .asProductType(Unit.pieces(), ProductTrackingStrategy.INDIVIDUALLY_TRACKED).build();
        mouse = new ProductBuilder(UuidProductIdentifier.random(), ProductName.of("Wireless Mouse"), ProductDescription.of("Ergonomic mouse"))
            .asProductType(Unit.pieces(), ProductTrackingStrategy.IDENTICAL).build();
        keyboard = new ProductBuilder(UuidProductIdentifier.random(), ProductName.of("Mechanical Keyboard"), ProductDescription.of("RGB keyboard"))
            .asProductType(Unit.pieces(), ProductTrackingStrategy.IDENTICAL).build();
        monitor = new ProductBuilder(UuidProductIdentifier.random(), ProductName.of("4K Monitor"), ProductDescription.of("27-inch display"))
            .asProductType(Unit.pieces(), ProductTrackingStrategy.INDIVIDUALLY_TRACKED).build();
        warranty = new ProductBuilder(UuidProductIdentifier.random(), ProductName.of("Extended Warranty"), ProductDescription.of("3-year warranty"))
            .asProductType(Unit.pieces(), ProductTrackingStrategy.IDENTICAL).build();
        insurance = new ProductBuilder(UuidProductIdentifier.random(), ProductName.of("Device Insurance"), ProductDescription.of("Accidental damage coverage"))
            .asProductType(Unit.pieces(), ProductTrackingStrategy.IDENTICAL).build();
    });

    it("should create simple package with required product", () => {
        const bundle = new ProductBuilder(UuidProductIdentifier.random(), ProductName.of("Laptop Bundle"), ProductDescription.of("Basic laptop package"))
            .asPackageType()
            .withRequiredChoice("laptop", laptop.id())
            .build();

        expect(bundle).toBeDefined();
        expect(bundle.name().equals(ProductName.of("Laptop Bundle"))).toBe(true);
        expect(bundle.structure().selectionRules().length).toBe(1);
    });

    it("should validate selection with required rule", () => {
        const bundle = new ProductBuilder(UuidProductIdentifier.random(), ProductName.of("Laptop Bundle"), ProductDescription.of("Basic laptop package"))
            .asPackageType()
            .withRequiredChoice("laptop", laptop.id())
            .build();

        const validSelection = [new SelectedProduct(laptop.id(), 1)];
        expect(bundle.validateSelection(validSelection).isValid()).toBe(true);

        const invalidSelection: SelectedProduct[] = [];
        expect(bundle.validateSelection(invalidSelection).isValid()).toBe(false);
    });

    it("should validate selection with optional rule", () => {
        const bundle = new ProductBuilder(UuidProductIdentifier.random(), ProductName.of("Laptop with Optional Warranty"), ProductDescription.of("Laptop package"))
            .asPackageType()
            .withOptionalChoice("warranty", warranty.id())
            .build();

        expect(bundle.validateSelection([]).isValid()).toBe(true);
        expect(bundle.validateSelection([new SelectedProduct(warranty.id(), 1)]).isValid()).toBe(true);
    });

    it("should validate selection with and rule", () => {
        const bundle = new ProductBuilder(UuidProductIdentifier.random(), ProductName.of("Laptop + Mouse Bundle"), ProductDescription.of("Complete workstation"))
            .asPackageType()
            .withRequiredChoice("laptop", laptop.id())
            .withRequiredChoice("mouse", mouse.id())
            .build();

        const valid = [new SelectedProduct(laptop.id(), 1), new SelectedProduct(mouse.id(), 1)];
        expect(bundle.validateSelection(valid).isValid()).toBe(true);

        const onlyLaptop = [new SelectedProduct(laptop.id(), 1)];
        expect(bundle.validateSelection(onlyLaptop).isValid()).toBe(false);
    });

    it("should validate selection with or rule", () => {
        const mouseSet = ProductSet.of("mouse", mouse.id());
        const keyboardSet = ProductSet.of("keyboard", keyboard.id());
        const rule = SelectionRuleFactory.or(SelectionRuleFactory.required(mouseSet), SelectionRuleFactory.required(keyboardSet));

        const bundle = new ProductBuilder(UuidProductIdentifier.random(), ProductName.of("Input Device Bundle"), ProductDescription.of("Choose mouse or keyboard"))
            .asPackageType()
            .withProductSets(mouseSet, keyboardSet)
            .withRule(rule)
            .build();

        expect(bundle.validateSelection([new SelectedProduct(mouse.id(), 1)]).isValid()).toBe(true);
        expect(bundle.validateSelection([new SelectedProduct(keyboard.id(), 1)]).isValid()).toBe(true);
        expect(bundle.validateSelection([]).isValid()).toBe(false);
    });

    it("should validate selection with conditional rule", () => {
        const laptopSet = ProductSet.of("laptop", laptop.id());
        const warrantySet = ProductSet.of("warranty", warranty.id());
        const rule = SelectionRuleFactory.ifThen(SelectionRuleFactory.required(laptopSet), SelectionRuleFactory.required(warrantySet));

        const bundle = new ProductBuilder(UuidProductIdentifier.random(), ProductName.of("Laptop with Mandatory Warranty"), ProductDescription.of("Warranty required for laptop"))
            .asPackageType()
            .withProductSets(laptopSet, warrantySet)
            .withRule(rule)
            .build();

        // No laptop, no warranty - OK (condition not met)
        expect(bundle.validateSelection([]).isValid()).toBe(true);

        // Laptop + warranty - OK
        expect(bundle.validateSelection([new SelectedProduct(laptop.id(), 1), new SelectedProduct(warranty.id(), 1)]).isValid()).toBe(true);

        // Laptop without warranty - NOT OK
        expect(bundle.validateSelection([new SelectedProduct(laptop.id(), 1)]).isValid()).toBe(false);
    });

    it("should validate isSubsetOf with quantity constraints", () => {
        const accessoriesSet = ProductSet.of("accessories", mouse.id(), keyboard.id(), monitor.id());
        const rule = SelectionRuleFactory.isSubsetOf(accessoriesSet, 2, 3);

        const bundle = new ProductBuilder(UuidProductIdentifier.random(), ProductName.of("Accessories Bundle"), ProductDescription.of("Choose 2-3 accessories"))
            .asPackageType()
            .withProductSet(accessoriesSet)
            .withRule(rule)
            .build();

        // Too few (1)
        expect(bundle.validateSelection([new SelectedProduct(mouse.id(), 1)]).isValid()).toBe(false);

        // Exactly 2
        expect(bundle.validateSelection([new SelectedProduct(mouse.id(), 1), new SelectedProduct(keyboard.id(), 1)]).isValid()).toBe(true);

        // Exactly 3
        expect(bundle.validateSelection([new SelectedProduct(mouse.id(), 1), new SelectedProduct(keyboard.id(), 1), new SelectedProduct(monitor.id(), 1)]).isValid()).toBe(true);

        // Too many (4 via quantity)
        expect(bundle.validateSelection([new SelectedProduct(mouse.id(), 2), new SelectedProduct(keyboard.id(), 1), new SelectedProduct(monitor.id(), 1)]).isValid()).toBe(false);
    });
});
