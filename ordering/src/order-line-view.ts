import { OrderLine } from './order-line.js';
import { OrderLineId } from './order-line-id.js';
import { PartyInOrderView } from './party-in-order-view.js';
import { PriceBreakdown } from './price-breakdown.js';

export class PriceBreakdownView {
    readonly componentName: string;
    readonly amount: string;
    readonly children: PriceBreakdownView[];

    constructor(componentName: string, amount: string, children: PriceBreakdownView[]) {
        this.componentName = componentName;
        this.amount = amount;
        this.children = children;
    }

    static from(breakdown: PriceBreakdown): PriceBreakdownView {
        return new PriceBreakdownView(
            breakdown.componentName,
            breakdown.amount.toString(),
            breakdown.children.map(c => PriceBreakdownView.from(c))
        );
    }
}

export class OrderLineView {
    readonly id: OrderLineId;
    readonly productId: string;
    readonly quantity: string;
    readonly specification: Map<string, string>;
    readonly parties: PartyInOrderView[];
    readonly pricingType: string;
    readonly unitPrice: string | null;
    readonly totalPrice: string | null;
    readonly breakdown: PriceBreakdownView[];

    constructor(
        id: OrderLineId,
        productId: string,
        quantity: string,
        specification: Map<string, string>,
        parties: PartyInOrderView[],
        pricingType: string,
        unitPrice: string | null,
        totalPrice: string | null,
        breakdown: PriceBreakdownView[]
    ) {
        this.id = id;
        this.productId = productId;
        this.quantity = quantity;
        this.specification = specification;
        this.parties = parties;
        this.pricingType = pricingType;
        this.unitPrice = unitPrice;
        this.totalPrice = totalPrice;
        this.breakdown = breakdown;
    }

    static from(line: OrderLine): OrderLineView {
        const pricing = line.pricing();
        const pricingType = pricing.pricingType;
        const unitPrice = line.isPriced() ? pricing.unitPrice().toString() : null;
        const totalPrice = line.isPriced() ? pricing.totalPrice().toString() : null;
        const breakdown = pricing.breakdown().map(b => PriceBreakdownView.from(b));

        return new OrderLineView(
            line.id(),
            line.productId().value,
            line.quantity().toString(),
            line.specification().attributes(),
            line.hasLineLevelParties()
                ? line.parties().parties().map(p => PartyInOrderView.from(p))
                : [],
            pricingType,
            unitPrice,
            totalPrice,
            breakdown
        );
    }
}
