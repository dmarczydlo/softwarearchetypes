import { Quantity } from '@softwarearchetypes/quantity';
import { BatchId } from './batch-id';
import { ProductIdentifier } from './product-identifier';
import { SerialNumber, serialNumberOf } from './serial-number';

export class CreateInstance {
    readonly productId: ProductIdentifier;
    readonly serialNumber: SerialNumber | null;
    readonly batchId: BatchId | null;
    readonly quantity: Quantity | null;
    readonly features: Map<string, string>;

    constructor(
        productId: ProductIdentifier,
        serialNumber: SerialNumber | null,
        batchId: BatchId | null,
        quantity: Quantity | null,
        features: Map<string, string>,
    ) {
        if (!productId) throw new Error('ProductIdentifier cannot be null');
        this.productId = productId;
        this.serialNumber = serialNumber;
        this.batchId = batchId;
        this.quantity = quantity;
        this.features = features ?? new Map();
    }

    static forProduct(productId: ProductIdentifier): CreateInstanceBuilder {
        return new CreateInstanceBuilder(productId);
    }
}

export class CreateInstanceBuilder {
    private readonly _productId: ProductIdentifier;
    private _serialNumber: SerialNumber | null = null;
    private _batchId: BatchId | null = null;
    private _quantity: Quantity | null = null;
    private _features: Map<string, string> = new Map();

    constructor(productId: ProductIdentifier) {
        this._productId = productId;
    }

    withSerial(serialNumber: SerialNumber | string): CreateInstanceBuilder {
        this._serialNumber = typeof serialNumber === 'string' ? serialNumberOf(serialNumber) : serialNumber;
        return this;
    }

    withBatch(batchId: BatchId): CreateInstanceBuilder {
        this._batchId = batchId;
        return this;
    }

    withQuantity(quantity: Quantity): CreateInstanceBuilder {
        this._quantity = quantity;
        return this;
    }

    withFeatures(features: Map<string, string>): CreateInstanceBuilder {
        this._features = features;
        return this;
    }

    build(): CreateInstance {
        return new CreateInstance(
            this._productId,
            this._serialNumber,
            this._batchId,
            this._quantity,
            this._features,
        );
    }
}
