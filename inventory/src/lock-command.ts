import { Quantity } from '@softwarearchetypes/quantity';
import { OwnerId } from './availability/owner-id';
import { ProductIdentifier } from './product-identifier';
import { ResourceSpecification } from './resource-specification';

export class LockCommand {
    readonly productId: ProductIdentifier;
    readonly quantity: Quantity;
    readonly owner: OwnerId;
    readonly resourceSpecification: ResourceSpecification;

    constructor(
        productId: ProductIdentifier,
        quantity: Quantity,
        owner: OwnerId,
        resourceSpecification: ResourceSpecification,
    ) {
        if (!productId) throw new Error('productId cannot be null');
        if (!quantity) throw new Error('quantity cannot be null');
        if (!owner) throw new Error('owner cannot be null');
        if (!resourceSpecification) throw new Error('resourceSpecification cannot be null');
        this.productId = productId;
        this.quantity = quantity;
        this.owner = owner;
        this.resourceSpecification = resourceSpecification;
    }
}
