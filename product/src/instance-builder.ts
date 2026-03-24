import { Quantity } from "@softwarearchetypes/quantity";
import { InstanceId } from "./instance-id";
import { SerialNumber } from "./serial-number";
import { BatchId } from "./batch";
import { ProductType } from "./product-type";
import { PackageType } from "./package-type";
import { ProductInstance } from "./product-instance";
import { PackageInstance } from "./package-instance";
import { ProductFeatureInstance } from "./product-feature-instance";
import { ProductFeatureInstances } from "./product-feature-instances";
import { ProductFeatureType } from "./product-feature-type";
import { SelectedInstance } from "./selected-instance";

export class InstanceBuilder {
    private readonly _id: InstanceId;
    private _serialNumber: SerialNumber | null = null;
    private _batchId: BatchId | null = null;

    constructor(id: InstanceId) {
        this._id = id;
    }

    withSerial(serialNumber: SerialNumber): InstanceBuilder {
        this._serialNumber = serialNumber;
        return this;
    }

    withBatch(batchId: BatchId): InstanceBuilder {
        this._batchId = batchId;
        return this;
    }

    asProductInstance(productType: ProductType): ProductInstanceBuilder {
        return new ProductInstanceBuilder(this._id, this._serialNumber, this._batchId, productType);
    }

    asPackageInstance(packageType: PackageType): PackageInstanceBuilder {
        return new PackageInstanceBuilder(this._id, this._serialNumber, this._batchId, packageType);
    }
}

export class ProductInstanceBuilder {
    private readonly _id: InstanceId;
    private readonly _serialNumber: SerialNumber | null;
    private readonly _batchId: BatchId | null;
    private readonly _productType: ProductType;
    private _quantity: Quantity | null = null;
    private readonly _features: ProductFeatureInstance[] = [];

    constructor(id: InstanceId, serialNumber: SerialNumber | null, batchId: BatchId | null, productType: ProductType) {
        this._id = id;
        this._serialNumber = serialNumber;
        this._batchId = batchId;
        this._productType = productType;
    }

    withQuantity(quantity: Quantity): ProductInstanceBuilder {
        this._quantity = quantity;
        return this;
    }

    withFeature(featureOrType: ProductFeatureInstance | ProductFeatureType, value?: unknown): ProductInstanceBuilder {
        if (featureOrType instanceof ProductFeatureInstance) {
            this._features.push(featureOrType);
        } else {
            this._features.push(new ProductFeatureInstance(featureOrType, value!));
        }
        return this;
    }

    build(): ProductInstance {
        const featureInstances = new ProductFeatureInstances(this._features);
        return new ProductInstance(this._id, this._productType, this._serialNumber, this._batchId, this._quantity, featureInstances);
    }
}

export class PackageInstanceBuilder {
    private readonly _id: InstanceId;
    private readonly _serialNumber: SerialNumber | null;
    private readonly _batchId: BatchId | null;
    private readonly _packageType: PackageType;
    private _selection: SelectedInstance[] = [];

    constructor(id: InstanceId, serialNumber: SerialNumber | null, batchId: BatchId | null, packageType: PackageType) {
        this._id = id;
        this._serialNumber = serialNumber;
        this._batchId = batchId;
        this._packageType = packageType;
    }

    withSelection(selection: SelectedInstance[]): PackageInstanceBuilder {
        this._selection = selection;
        return this;
    }

    build(): PackageInstance {
        return new PackageInstance(this._id, this._packageType, this._selection, this._serialNumber, this._batchId);
    }
}
