import { Preconditions } from '@softwarearchetypes/common';
import { Quantity } from '@softwarearchetypes/quantity';
import { OrderLineId } from './order-line-id.js';
import { OrderLinePricing, NotPricedYet } from './order-line-pricing.js';
import { OrderLineSpecification } from './order-line-specification.js';
import { OrderParties } from './order-parties.js';
import { ProductIdentifier } from './product-identifier.js';

export class OrderLine {
    private readonly _id: OrderLineId;
    private readonly _productId: ProductIdentifier;
    private readonly _quantity: Quantity;
    private readonly _specification: OrderLineSpecification;
    private readonly _parties: OrderParties;
    private _pricing: OrderLinePricing;

    constructor(
        id: OrderLineId,
        productId: ProductIdentifier,
        quantity: Quantity,
        specification: OrderLineSpecification,
        parties: OrderParties | null,
        pricing?: OrderLinePricing
    ) {
        Preconditions.checkArgument(id != null, "OrderLineId must be defined");
        Preconditions.checkArgument(productId != null, "ProductIdentifier must be defined");
        Preconditions.checkArgument(quantity != null, "Quantity must be defined");
        Preconditions.checkArgument(specification != null, "Specification must be defined");

        this._id = id;
        this._productId = productId;
        this._quantity = quantity;
        this._specification = specification;
        this._parties = parties != null ? parties : OrderParties.forOrderLine([]);
        this._pricing = pricing ?? new NotPricedYet();
    }

    id(): OrderLineId {
        return this._id;
    }

    productId(): ProductIdentifier {
        return this._productId;
    }

    quantity(): Quantity {
        return this._quantity;
    }

    specification(): OrderLineSpecification {
        return this._specification;
    }

    parties(): OrderParties {
        return this._parties;
    }

    pricing(): OrderLinePricing {
        return this._pricing;
    }

    isPriced(): boolean {
        return !(this._pricing instanceof NotPricedYet);
    }

    hasDefinitivePrice(): boolean {
        return this._pricing.isDefinitive();
    }

    applyPricing(pricing: OrderLinePricing): void {
        Preconditions.checkArgument(pricing != null, "Pricing must be defined");
        this._pricing = pricing;
    }

    hasLineLevelParties(): boolean {
        return this._parties != null && !this._parties.isEmpty();
    }

    toString(): string {
        return `OrderLine{id=${this._id}, productId=${this._productId}, quantity=${this._quantity}, spec=${this._specification}, pricing=${this._pricing.pricingType}, parties=${this.hasLineLevelParties() ? this._parties : "inherited"}}`;
    }
}
