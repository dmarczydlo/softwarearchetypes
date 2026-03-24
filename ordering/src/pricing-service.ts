import { Money, Quantity } from '@softwarearchetypes/quantity';
import { OrderLine } from './order-line.js';
import { OrderLinePricing, NotPricedYet, CalculatedPricing, EstimatedPricing } from './order-line-pricing.js';
import { OrderLineSpecification } from './order-line-specification.js';
import { OrderParties } from './order-parties.js';
import { PriceBreakdown } from './price-breakdown.js';
import { ProductIdentifier } from './product-identifier.js';

export class PricingContext {
    readonly productId: ProductIdentifier;
    readonly quantity: Quantity;
    readonly parties: OrderParties;
    readonly specification: OrderLineSpecification;
    readonly pricingTime: Date;

    constructor(
        productId: ProductIdentifier,
        quantity: Quantity,
        parties: OrderParties,
        specification: OrderLineSpecification,
        pricingTime: Date
    ) {
        this.productId = productId;
        this.quantity = quantity;
        this.parties = parties;
        this.specification = specification;
        this.pricingTime = pricingTime;
    }

    static forOrderLine(line: OrderLine, effectiveParties: OrderParties): PricingContext {
        return new PricingContext(
            line.productId(),
            line.quantity(),
            effectiveParties,
            line.specification(),
            new Date()
        );
    }
}

export interface PricingService {
    calculatePrice(context: PricingContext): OrderLinePricing;
}

export class FixablePricingService implements PricingService {
    private pricingFunction: (ctx: PricingContext) => OrderLinePricing = () => new NotPricedYet();
    private readonly _calculateRequests: PricingContext[] = [];

    calculatePrice(context: PricingContext): OrderLinePricing {
        this._calculateRequests.push(context);
        return this.pricingFunction(context);
    }

    willReturn(pricing: OrderLinePricing): void {
        this.pricingFunction = () => pricing;
    }

    willCalculate(unitPrice: Money, totalPrice: Money): void {
        this.pricingFunction = () => new CalculatedPricing(unitPrice, totalPrice);
    }

    willCalculateWithBreakdown(unitPrice: Money, totalPrice: Money, breakdown: PriceBreakdown[]): void {
        this.pricingFunction = () => new CalculatedPricing(unitPrice, totalPrice, breakdown);
    }

    willEstimate(unitPrice: Money, totalPrice: Money): void {
        this.pricingFunction = () => new EstimatedPricing(unitPrice, totalPrice);
    }

    willAnswer(pricingFunction: (ctx: PricingContext) => OrderLinePricing): void {
        this.pricingFunction = pricingFunction;
    }

    calculateRequests(): PricingContext[] {
        return [...this._calculateRequests];
    }
}
