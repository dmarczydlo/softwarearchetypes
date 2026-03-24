import { Preconditions } from "@softwarearchetypes/common";
import { Quantity, Unit } from "@softwarearchetypes/quantity";
import { Instance } from "./instance";
import { Product } from "./product";
import { ProductType } from "./product-type";
import { ProductIdentifier } from "./product-identifier";
import { InstanceId } from "./instance-id";
import { SerialNumber } from "./serial-number";
import { BatchId } from "./batch";
import { ProductTrackingStrategy, ProductTrackingStrategyOps } from "./product-tracking-strategy";
import { ProductFeatureInstances } from "./product-feature-instances";

export class ProductInstance implements Instance {

    private readonly _id: InstanceId;
    private readonly _productType: ProductType;
    private readonly _serialNumber: SerialNumber | null;
    private readonly _batchId: BatchId | null;
    private readonly _quantity: Quantity | null;
    private readonly _features: ProductFeatureInstances;

    constructor(
        id: InstanceId,
        productType: ProductType,
        serialNumber: SerialNumber | null,
        batchId: BatchId | null,
        quantity: Quantity | null,
        features: ProductFeatureInstances,
    ) {
        Preconditions.checkArgument(id != null, "InstanceId must be defined");
        Preconditions.checkArgument(productType != null, "ProductType must be defined");
        Preconditions.checkArgument(features != null, "ProductFeatureInstances must be defined");

        ProductInstance.validateTrackingRequirements(productType, serialNumber, batchId);
        ProductInstance.validateQuantityUnit(productType, quantity);
        features.validateAgainst(productType.featureTypes());

        this._id = id;
        this._productType = productType;
        this._serialNumber = serialNumber;
        this._batchId = batchId;
        this._quantity = quantity;
        this._features = features;
    }

    private static validateTrackingRequirements(productType: ProductType, serialNumber: SerialNumber | null, batchId: BatchId | null): void {
        const strategy = productType.trackingStrategy();

        if (ProductTrackingStrategyOps.isInterchangeable(strategy)) {
            Preconditions.checkArgument(serialNumber == null && batchId == null,
                "IDENTICAL products must not have SerialNumber or BatchId");
            return;
        }

        Preconditions.checkArgument(serialNumber != null || batchId != null,
            "ProductInstance must have either SerialNumber or BatchId for strategy: " + strategy);

        if (ProductTrackingStrategyOps.isTrackedIndividually(strategy) && serialNumber == null) {
            throw new Error("ProductType requires individual tracking (strategy: " + strategy + ") but no serial number defined");
        }
        if (ProductTrackingStrategyOps.isTrackedByBatch(strategy) && batchId == null) {
            throw new Error("ProductType requires batch tracking (strategy: " + strategy + ") but no batch id defined");
        }
        if (ProductTrackingStrategyOps.requiresBothTrackingMethods(strategy) && (serialNumber == null || batchId == null)) {
            throw new Error("ProductType requires both individual and batch tracking (strategy: " + strategy + ") but neither serial number nor batch id defined");
        }
    }

    private static validateQuantityUnit(productType: ProductType, quantity: Quantity | null): void {
        if (quantity != null) {
            Preconditions.checkArgument(quantity.unit.equals(productType.preferredUnit),
                "Quantity unit must match ProductType's preferred unit");
        }
    }

    id(): InstanceId { return this._id; }
    product(): Product { return this._productType; }
    productType(): ProductType { return this._productType; }
    serialNumber(): SerialNumber | null { return this._serialNumber; }
    batchId(): BatchId | null { return this._batchId; }
    quantity(): Quantity | null { return this._quantity; }

    effectiveQuantity(): Quantity {
        return this._quantity != null
            ? this._quantity
            : Quantity.of(1, this._productType.preferredUnit);
    }

    features(): ProductFeatureInstances { return this._features; }

    toString(): string {
        return `ProductInstance{id=${this._id}, type=${this._productType.name()}, serial=${this._serialNumber ?? "none"}, batch=${this._batchId ?? "none"}, quantity=${this._quantity ?? "implicit 1 " + this._productType.preferredUnit}, features=${this._features}}`;
    }
}
