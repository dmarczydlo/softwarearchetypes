import { Quantity } from '@softwarearchetypes/quantity';
import { BatchId } from './batch-id';
import { InstanceId } from './instance-id';
import { ProductIdentifier } from './product-identifier';
import { ProductInstance } from './product-instance';
import { SerialNumber } from './serial-number';

export class InstanceBuilder {
    private readonly _id: InstanceId;
    private readonly _productId: ProductIdentifier;
    private _serialNumber: SerialNumber | null = null;
    private _batchId: BatchId | null = null;
    private _quantity: Quantity | null = null;
    private readonly _features = new Map<string, string>();

    constructor(id: InstanceId, productId: ProductIdentifier) {
        if (!id) throw new Error('InstanceId cannot be null');
        if (!productId) throw new Error('ProductIdentifier cannot be null');
        this._id = id;
        this._productId = productId;
    }

    withSerial(serialNumber: SerialNumber | null): InstanceBuilder {
        this._serialNumber = serialNumber;
        return this;
    }

    withBatch(batchId: BatchId | null): InstanceBuilder {
        this._batchId = batchId;
        return this;
    }

    withQuantity(quantity: Quantity | null): InstanceBuilder {
        this._quantity = quantity;
        return this;
    }

    withFeature(name: string, value: string): InstanceBuilder {
        this._features.set(name, value);
        return this;
    }

    withFeatures(features: Map<string, string> | null): InstanceBuilder {
        if (features) {
            for (const [key, value] of features) {
                this._features.set(key, value);
            }
        }
        return this;
    }

    build(): ProductInstance {
        return new ProductInstance(
            this._id,
            this._productId,
            this._serialNumber,
            this._batchId,
            this._quantity,
            new Map(this._features),
        );
    }
}
