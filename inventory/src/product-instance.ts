import { Quantity, Unit } from '@softwarearchetypes/quantity';
import { BatchId } from './batch-id';
import { Instance } from './instance';
import { InstanceId } from './instance-id';
import { ProductIdentifier } from './product-identifier';
import { SerialNumber } from './serial-number';

export class ProductInstance implements Instance {
    readonly id: InstanceId;
    readonly productId: ProductIdentifier;
    private readonly _serialNumber: SerialNumber | null;
    private readonly _batchId: BatchId | null;
    private readonly _quantity: Quantity | null;
    private readonly _features: Map<string, string>;

    constructor(
        id: InstanceId,
        productId: ProductIdentifier,
        serialNumber: SerialNumber | null,
        batchId: BatchId | null,
        quantity: Quantity | null,
        features: Map<string, string>,
    ) {
        if (!id) throw new Error('InstanceId cannot be null');
        if (!productId) throw new Error('ProductIdentifier cannot be null');
        this.id = id;
        this.productId = productId;
        this._serialNumber = serialNumber;
        this._batchId = batchId;
        this._quantity = quantity;
        this._features = new Map(features);
    }

    serialNumber(): SerialNumber | null {
        return this._serialNumber;
    }

    batchId(): BatchId | null {
        return this._batchId;
    }

    quantity(): Quantity | null {
        return this._quantity;
    }

    effectiveQuantity(): Quantity {
        return this._quantity ?? Quantity.of(1, Unit.pieces());
    }

    features(): Map<string, string> {
        return new Map(this._features);
    }

    feature(name: string): string | null {
        return this._features.get(name) ?? null;
    }

    toString(): string {
        return `ProductInstance{id=${this.id}, productId=${this.productId}, serial=${this._serialNumber ?? 'none'}, batch=${this._batchId ?? 'none'}, quantity=${this._quantity ?? 'implicit'}}`;
    }
}
