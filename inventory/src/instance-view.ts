import { InstanceId } from './instance-id';
import { ProductIdentifier } from './product-identifier';
import { ProductInstance } from './product-instance';

export class InstanceView {
    readonly id: InstanceId;
    readonly productId: ProductIdentifier;
    readonly serialNumber: string | null;
    readonly batchId: string | null;
    readonly quantity: string | null;
    readonly features: Map<string, string>;

    constructor(
        id: InstanceId,
        productId: ProductIdentifier,
        serialNumber: string | null,
        batchId: string | null,
        quantity: string | null,
        features: Map<string, string>,
    ) {
        this.id = id;
        this.productId = productId;
        this.serialNumber = serialNumber;
        this.batchId = batchId;
        this.quantity = quantity;
        this.features = features;
    }

    static from(instance: ProductInstance): InstanceView {
        return new InstanceView(
            instance.id,
            instance.productId,
            instance.serialNumber()?.value ?? null,
            instance.batchId()?.toString() ?? null,
            instance.quantity()?.toString() ?? null,
            instance.features(),
        );
    }
}
