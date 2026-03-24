import { Quantity, Unit } from '@softwarearchetypes/quantity';
import { BatchId } from './batch-id';
import { InstanceId } from './instance-id';
import { ProductIdentifier } from './product-identifier';
import { SerialNumber } from './serial-number';

export interface Instance {
    readonly id: InstanceId;
    readonly productId: ProductIdentifier;
    serialNumber(): SerialNumber | null;
    batchId(): BatchId | null;
    quantity(): Quantity | null;
    effectiveQuantity(): Quantity;
}

export function defaultEffectiveQuantity(instance: Instance): Quantity {
    return instance.quantity() ?? Quantity.of(1, Unit.pieces());
}
