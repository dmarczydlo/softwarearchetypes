import { describe, it, expect } from 'vitest';
import { Money } from '@softwarearchetypes/quantity';
import {
    OrderLinePricing, CalculatedPricing, EstimatedPricing, ArbitraryPricing, NotPricedYet,
    isCalculatedPricing, isArbitraryPricing, isEstimatedPricing, isNotPricedYet
} from './order-line-pricing.js';
import { PriceBreakdown } from './price-breakdown.js';

describe('OrderLinePricing', () => {
    it('should be definitive for calculated pricing', () => {
        const pricing: OrderLinePricing = new CalculatedPricing(Money.pln(10), Money.pln(30));

        expect(pricing.isDefinitive()).toBe(true);
        expect(pricing.unitPrice().equals(Money.pln(10))).toBe(true);
        expect(pricing.totalPrice().equals(Money.pln(30))).toBe(true);
        expect(pricing.breakdown()).toHaveLength(0);
    });

    it('should preserve breakdown components in calculated pricing', () => {
        const breakdown = [
            new PriceBreakdown("base", Money.pln(20)),
            new PriceBreakdown("tax", Money.pln(10))
        ];

        const pricing: OrderLinePricing = new CalculatedPricing(Money.pln(10), Money.pln(30), breakdown);

        expect(pricing.breakdown()).toHaveLength(2);
        expect(pricing.breakdown()[0].componentName).toBe("base");
        expect(pricing.breakdown()[0].amount.equals(Money.pln(20))).toBe(true);
        expect(pricing.breakdown()[1].componentName).toBe("tax");
        expect(pricing.breakdown()[1].amount.equals(Money.pln(10))).toBe(true);
    });

    it('should be definitive for arbitrary pricing with reason', () => {
        const pricing = new ArbitraryPricing(Money.pln(50), Money.pln(150), "VIP discount");

        expect(pricing.isDefinitive()).toBe(true);
        expect(pricing.unitPrice().equals(Money.pln(50))).toBe(true);
        expect(pricing.totalPrice().equals(Money.pln(150))).toBe(true);
        expect(pricing.breakdown()).toHaveLength(0);
        expect(pricing.reason).toBe("VIP discount");
    });

    it('should not be definitive for estimated pricing', () => {
        const pricing: OrderLinePricing = new EstimatedPricing(Money.pln(10), Money.pln(30));

        expect(pricing.isDefinitive()).toBe(false);
        expect(pricing.unitPrice().equals(Money.pln(10))).toBe(true);
        expect(pricing.totalPrice().equals(Money.pln(30))).toBe(true);
        expect(pricing.breakdown()).toHaveLength(0);
    });

    it('should not be definitive when not priced yet', () => {
        const pricing: OrderLinePricing = new NotPricedYet();

        expect(pricing.isDefinitive()).toBe(false);
        expect(pricing.breakdown()).toHaveLength(0);
    });

    it('should throw on unitPrice when not priced yet', () => {
        const pricing: OrderLinePricing = new NotPricedYet();

        expect(() => pricing.unitPrice()).toThrow();
    });

    it('should throw on totalPrice when not priced yet', () => {
        const pricing: OrderLinePricing = new NotPricedYet();

        expect(() => pricing.totalPrice()).toThrow();
    });

    it('should preserve children in nested breakdown', () => {
        const child1 = new PriceBreakdown("base", Money.pln(20));
        const child2 = new PriceBreakdown("margin", Money.pln(10));

        const parent = new PriceBreakdown("total", Money.pln(30), [child1, child2]);

        expect(parent.children).toHaveLength(2);
        expect(parent.children[0].componentName).toBe("base");
        expect(parent.children[0].amount.equals(Money.pln(20))).toBe(true);
        expect(parent.children[1].componentName).toBe("margin");
        expect(parent.children[1].amount.equals(Money.pln(10))).toBe(true);
        expect(parent.amount.equals(Money.pln(30))).toBe(true);
    });

    it('should support type guards on all pricing strategies', () => {
        const pricing: OrderLinePricing = new CalculatedPricing(Money.pln(10), Money.pln(30));

        let result: string;
        if (isCalculatedPricing(pricing)) {
            result = "calculated: " + pricing.totalPrice().toString();
        } else if (isArbitraryPricing(pricing)) {
            result = "arbitrary: " + pricing.reason;
        } else if (isEstimatedPricing(pricing)) {
            result = "estimated: " + pricing.totalPrice().toString();
        } else if (isNotPricedYet(pricing)) {
            result = "not priced";
        } else {
            result = "unknown";
        }

        expect(result).toBe("calculated: PLN 30");
    });

    it('should preserve breakdown in estimated pricing', () => {
        const breakdown = [
            new PriceBreakdown("labor", Money.pln(400)),
            new PriceBreakdown("materials", Money.pln(100))
        ];

        const pricing: OrderLinePricing = new EstimatedPricing(Money.pln(500), Money.pln(500), breakdown);

        expect(pricing.isDefinitive()).toBe(false);
        expect(pricing.breakdown()).toHaveLength(2);
        expect(pricing.breakdown()[0].componentName).toBe("labor");
        expect(pricing.breakdown()[0].amount.equals(Money.pln(400))).toBe(true);
        expect(pricing.breakdown()[1].componentName).toBe("materials");
        expect(pricing.breakdown()[1].amount.equals(Money.pln(100))).toBe(true);
    });
});
