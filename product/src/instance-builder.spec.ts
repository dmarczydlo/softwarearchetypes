import { describe, it, expect, beforeEach } from "vitest";
import { Quantity, Unit } from "@softwarearchetypes/quantity";
import { ProductType } from "./product-type";
import { PackageType } from "./package-type";
import { ProductBuilder } from "./product-builder";
import { UuidProductIdentifier } from "./product-identifier";
import { ProductName } from "./product-name";
import { ProductDescription } from "./product-description";
import { ProductTrackingStrategy } from "./product-tracking-strategy";
import { InstanceId } from "./instance-id";
import { InstanceBuilder } from "./instance-builder";
import { SerialNumberFactory } from "./serial-number";
import { BatchId } from "./batch";
import { ProductFeatureType } from "./product-feature-type";
import { ProductFeatureInstance } from "./product-feature-instance";
import { SelectedInstance } from "./selected-instance";

describe("InstanceBuilder", () => {
    let laptop: ProductType;
    let mouse: ProductType;
    let bundle: PackageType;
    let colorFeature: ProductFeatureType;
    let storageFeature: ProductFeatureType;

    beforeEach(() => {
        colorFeature = ProductFeatureType.withAllowedValues("Color", "Silver", "Space Gray", "Black");
        storageFeature = ProductFeatureType.withAllowedValues("Storage", "512GB", "1024GB");

        laptop = new ProductBuilder(UuidProductIdentifier.random(), ProductName.of("Business Laptop"), ProductDescription.of("Professional laptop"))
            .asProductType(Unit.pieces(), ProductTrackingStrategy.INDIVIDUALLY_TRACKED)
            .withOptionalFeature(colorFeature)
            .withOptionalFeature(storageFeature)
            .build();

        mouse = ProductType.builder(
            UuidProductIdentifier.random(), ProductName.of("Wireless Mouse"), ProductDescription.of("Ergonomic mouse"),
            Unit.pieces(), ProductTrackingStrategy.BATCH_TRACKED
        ).build();

        bundle = new ProductBuilder(UuidProductIdentifier.random(), ProductName.of("Workstation Bundle"), ProductDescription.of("Complete setup"))
            .asPackageType()
            .withRequiredChoice("laptop", laptop.id())
            .withRequiredChoice("mouse", mouse.id())
            .build();
    });

    it("should build product instance with serial", () => {
        const id = InstanceId.newOne();
        const serial = SerialNumberFactory.of("LAPTOP-123");

        const instance = new InstanceBuilder(id)
            .withSerial(serial)
            .asProductInstance(laptop)
            .withQuantity(Quantity.of(1, Unit.pieces()))
            .build();

        expect(instance).toBeDefined();
        expect(instance.id().equals(id)).toBe(true);
        expect(instance.product()).toBe(laptop);
        expect(instance.serialNumber()).toBe(serial);
        expect(instance.batchId()).toBeNull();
    });

    it("should build product instance with batch", () => {
        const id = InstanceId.newOne();
        const batch = BatchId.newOne();

        const instance = new InstanceBuilder(id)
            .withBatch(batch)
            .asProductInstance(mouse)
            .withQuantity(Quantity.of(1, Unit.pieces()))
            .build();

        expect(instance).toBeDefined();
        expect(instance.serialNumber()).toBeNull();
        expect(instance.batchId()).toBe(batch);
    });

    it("should build product instance with features", () => {
        const instance = new InstanceBuilder(InstanceId.newOne())
            .withSerial(SerialNumberFactory.of("LAPTOP-123"))
            .asProductInstance(laptop)
            .withQuantity(Quantity.of(1, Unit.pieces()))
            .withFeature(colorFeature, "Silver")
            .build();

        expect(instance).toBeDefined();
        expect(instance.features().size()).toBe(1);
        expect(instance.features().has(colorFeature)).toBe(true);
        expect(instance.features().get(colorFeature)!.value()).toBe("Silver");
    });

    it("should build product instance with multiple features", () => {
        const instance = new InstanceBuilder(InstanceId.newOne())
            .withSerial(SerialNumberFactory.of("LAPTOP-123"))
            .asProductInstance(laptop)
            .withQuantity(Quantity.of(1, Unit.pieces()))
            .withFeature(colorFeature, "Silver")
            .withFeature(storageFeature, "512GB")
            .build();

        expect(instance.features().size()).toBe(2);
        expect(instance.features().has(colorFeature)).toBe(true);
        expect(instance.features().has(storageFeature)).toBe(true);
    });

    it("should build package instance with serial", () => {
        const laptopInstance = new InstanceBuilder(InstanceId.newOne())
            .withSerial(SerialNumberFactory.of("LAPTOP-001"))
            .asProductInstance(laptop)
            .withQuantity(Quantity.of(1, Unit.pieces()))
            .build();

        const mouseInstance = new InstanceBuilder(InstanceId.newOne())
            .withBatch(BatchId.newOne())
            .asProductInstance(mouse)
            .withQuantity(Quantity.of(1, Unit.pieces()))
            .build();

        const packageId = InstanceId.newOne();
        const packageSerial = SerialNumberFactory.of("BUNDLE-001");

        const packageInstance = new InstanceBuilder(packageId)
            .withSerial(packageSerial)
            .asPackageInstance(bundle)
            .withSelection([
                new SelectedInstance(laptopInstance, 1),
                new SelectedInstance(mouseInstance, 1),
            ])
            .build();

        expect(packageInstance).toBeDefined();
        expect(packageInstance.id().equals(packageId)).toBe(true);
        expect(packageInstance.product()).toBe(bundle);
        expect(packageInstance.serialNumber()).toBe(packageSerial);
        expect(packageInstance.selection().length).toBe(2);
    });

    it("should reject package instance without tracking", () => {
        const laptopInstance = new InstanceBuilder(InstanceId.newOne())
            .withSerial(SerialNumberFactory.of("LAPTOP-001"))
            .asProductInstance(laptop)
            .withQuantity(Quantity.of(1, Unit.pieces()))
            .build();

        const mouseInstance = new InstanceBuilder(InstanceId.newOne())
            .withBatch(BatchId.newOne())
            .asProductInstance(mouse)
            .withQuantity(Quantity.of(1, Unit.pieces()))
            .build();

        expect(() => {
            new InstanceBuilder(InstanceId.newOne())
                .asPackageInstance(bundle)
                .withSelection([
                    new SelectedInstance(laptopInstance, 1),
                    new SelectedInstance(mouseInstance, 1),
                ])
                .build();
        }).toThrow();
    });
});
