import { Money } from '@softwarearchetypes/quantity';
import { PriceBreakdown } from './price-breakdown.js';

export interface OrderLinePricing {
    readonly pricingType: string;
    unitPrice(): Money;
    totalPrice(): Money;
    breakdown(): PriceBreakdown[];
    isDefinitive(): boolean;
}

export class CalculatedPricing implements OrderLinePricing {
    readonly pricingType = "CalculatedPricing";
    private readonly _unitPrice: Money;
    private readonly _totalPrice: Money;
    private readonly _breakdown: PriceBreakdown[];

    constructor(unitPrice: Money, totalPrice: Money, breakdown: PriceBreakdown[] = []) {
        this._unitPrice = unitPrice;
        this._totalPrice = totalPrice;
        this._breakdown = [...breakdown];
    }

    unitPrice(): Money {
        return this._unitPrice;
    }

    totalPrice(): Money {
        return this._totalPrice;
    }

    breakdown(): PriceBreakdown[] {
        return [...this._breakdown];
    }

    isDefinitive(): boolean {
        return true;
    }
}

export class EstimatedPricing implements OrderLinePricing {
    readonly pricingType = "EstimatedPricing";
    private readonly _unitPrice: Money;
    private readonly _totalPrice: Money;
    private readonly _breakdown: PriceBreakdown[];

    constructor(unitPrice: Money, totalPrice: Money, breakdown: PriceBreakdown[] = []) {
        this._unitPrice = unitPrice;
        this._totalPrice = totalPrice;
        this._breakdown = [...breakdown];
    }

    unitPrice(): Money {
        return this._unitPrice;
    }

    totalPrice(): Money {
        return this._totalPrice;
    }

    breakdown(): PriceBreakdown[] {
        return [...this._breakdown];
    }

    isDefinitive(): boolean {
        return false;
    }
}

export class ArbitraryPricing implements OrderLinePricing {
    readonly pricingType = "ArbitraryPricing";
    private readonly _unitPrice: Money;
    private readonly _totalPrice: Money;
    readonly reason: string;

    constructor(unitPrice: Money, totalPrice: Money, reason: string) {
        this._unitPrice = unitPrice;
        this._totalPrice = totalPrice;
        this.reason = reason;
    }

    unitPrice(): Money {
        return this._unitPrice;
    }

    totalPrice(): Money {
        return this._totalPrice;
    }

    breakdown(): PriceBreakdown[] {
        return [];
    }

    isDefinitive(): boolean {
        return true;
    }
}

export class NotPricedYet implements OrderLinePricing {
    readonly pricingType = "NotPricedYet";

    unitPrice(): Money {
        throw new Error("Order line has not been priced yet");
    }

    totalPrice(): Money {
        throw new Error("Order line has not been priced yet");
    }

    breakdown(): PriceBreakdown[] {
        return [];
    }

    isDefinitive(): boolean {
        return false;
    }
}

export function isCalculatedPricing(pricing: OrderLinePricing): pricing is CalculatedPricing {
    return pricing.pricingType === "CalculatedPricing";
}

export function isEstimatedPricing(pricing: OrderLinePricing): pricing is EstimatedPricing {
    return pricing.pricingType === "EstimatedPricing";
}

export function isArbitraryPricing(pricing: OrderLinePricing): pricing is ArbitraryPricing {
    return pricing.pricingType === "ArbitraryPricing";
}

export function isNotPricedYet(pricing: OrderLinePricing): pricing is NotPricedYet {
    return pricing.pricingType === "NotPricedYet";
}
