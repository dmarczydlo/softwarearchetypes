import { Quantity } from '@softwarearchetypes/quantity';
import { OwnerId } from '../availability/owner-id';
import { ProductIdentifier } from '../product-identifier';
import { ResourceSpecification } from '../resource-specification';
import { ReservationPurpose } from './reservation-purpose';

export class ReserveRequest {
    readonly productId: ProductIdentifier;
    readonly quantity: Quantity;
    readonly owner: OwnerId;
    readonly purpose: ReservationPurpose;
    readonly resourceSpecification: ResourceSpecification;
    readonly validForMs: number | null;

    constructor(
        productId: ProductIdentifier,
        quantity: Quantity,
        owner: OwnerId,
        purpose: ReservationPurpose,
        resourceSpecification: ResourceSpecification,
        validForMs: number | null,
    ) {
        if (!productId) throw new Error('productId cannot be null');
        if (!quantity) throw new Error('quantity cannot be null');
        if (!owner) throw new Error('owner cannot be null');
        if (!purpose) throw new Error('purpose cannot be null');
        if (!resourceSpecification) throw new Error('resourceSpecification cannot be null');
        this.productId = productId;
        this.quantity = quantity;
        this.owner = owner;
        this.purpose = purpose;
        this.resourceSpecification = resourceSpecification;
        this.validForMs = validForMs;
    }

    static forProduct(productId: ProductIdentifier): ReserveRequestBuilder {
        return new ReserveRequestBuilder(productId);
    }
}

export class ReserveRequestBuilder {
    private readonly _productId: ProductIdentifier;
    private _quantity!: Quantity;
    private _owner!: OwnerId;
    private _purpose: ReservationPurpose = ReservationPurpose.BOOKING;
    private _resourceSpecification!: ResourceSpecification;
    private _validForMs: number | null = null;

    constructor(productId: ProductIdentifier) {
        this._productId = productId;
    }

    quantity(quantity: Quantity): ReserveRequestBuilder {
        this._quantity = quantity;
        return this;
    }

    owner(owner: OwnerId): ReserveRequestBuilder {
        this._owner = owner;
        return this;
    }

    purpose(purpose: ReservationPurpose): ReserveRequestBuilder {
        this._purpose = purpose;
        return this;
    }

    resourceSpecification(spec: ResourceSpecification): ReserveRequestBuilder {
        this._resourceSpecification = spec;
        return this;
    }

    validForMs(ms: number): ReserveRequestBuilder {
        this._validForMs = ms;
        return this;
    }

    build(): ReserveRequest {
        return new ReserveRequest(
            this._productId,
            this._quantity,
            this._owner,
            this._purpose,
            this._resourceSpecification,
            this._validForMs,
        );
    }
}
