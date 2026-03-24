import { describe, it, expect } from 'vitest';
import { UserJourney } from './UserJourney.js';
import { UserJourneyId } from './UserJourneyId.js';
import { State } from './State.js';
import { Product, ProductType } from './Product.js';
import { Condition, ConditionType } from './Condition.js';

describe('WeightedPaths', () => {
    it('should find cheapest path by minimizing cost', () => {
        const newLoan = State.of(Product.newLoan());
        const intermediate = State.of(Product.penalty());
        const discount = State.of(Product.discount(10));
        const directExpensive = Condition.withCost(ConditionType.PAYMENT_ON_TIME, 100.0);
        const cheapStep1 = Condition.withCost(ConditionType.LATE_PAYMENT, 30.0);
        const cheapStep2 = Condition.withCost(ConditionType.RESTRUCTURING, 20.0);

        const journey = UserJourney.builder(UserJourneyId.of('user-1'))
            .from(newLoan).on(directExpensive).goto_(discount)
            .from(newLoan).on(cheapStep1).goto_(intermediate)
            .from(intermediate).on(cheapStep2).goto_(discount)
            .withCurrentState(newLoan)
            .build();

        const cheapestPath = journey.optimizedWayToAchieve(ProductType.DISCOUNT, c => c.getCost());

        expect(cheapestPath).not.toBeNull();
        expect(cheapestPath!.length()).toBe(2);
        expect(cheapestPath!.conditions.some(c => c.equals(cheapStep1))).toBe(true);
        expect(cheapestPath!.conditions.some(c => c.equals(cheapStep2))).toBe(true);
    });

    it('should find fastest path by minimizing time', () => {
        const newLoan = State.of(Product.newLoan());
        const intermediate1 = State.of(Product.penalty());
        const intermediate2 = State.of(Product.newLoan(), Product.penalty());
        const discount = State.of(Product.discount(10));

        const fastPath = Condition.withTime(ConditionType.PAYMENT_ON_TIME, 5);

        const slowStep1 = Condition.withTime(ConditionType.LATE_PAYMENT, 15);
        const slowStep2 = Condition.withTime(ConditionType.RESTRUCTURING, 10);

        const mediumStep1 = Condition.withTime(ConditionType.PROMOTION_APPROVED, 7);
        const mediumStep2 = Condition.withTime(ConditionType.PAYMENT_ON_TIME, 4);

        const journey = UserJourney.builder(UserJourneyId.of('user-2'))
            .from(newLoan).on(fastPath).goto_(discount)
            .from(newLoan).on(slowStep1).goto_(intermediate1)
            .from(intermediate1).on(slowStep2).goto_(discount)
            .from(newLoan).on(mediumStep1).goto_(intermediate2)
            .from(intermediate2).on(mediumStep2).goto_(discount)
            .withCurrentState(newLoan)
            .build();

        const fastestPath = journey.optimizedWayToAchieve(ProductType.DISCOUNT, c => c.getTime());

        expect(fastestPath).not.toBeNull();
        expect(fastestPath!.length()).toBe(1);
        expect(fastestPath!.conditions.some(c => c.equals(fastPath))).toBe(true);
    });

    it('should demonstrate tradeoff between cost and time', () => {
        const newLoan = State.of(Product.newLoan());
        const expressRoute = State.of(Product.penalty());
        const economyRoute = State.of(Product.discount(5));
        const discount10 = State.of(Product.discount(10));

        const expressStep1 = Condition.withAttributes(ConditionType.PAYMENT_ON_TIME, 150.0, 3, 0.0);
        const economyStep1 = Condition.withAttributes(ConditionType.LATE_PAYMENT, 20.0, 30, 0.0);
        const toDiscount1 = Condition.withAttributes(ConditionType.PROMOTION_APPROVED, 10.0, 1, 0.0);
        const toDiscount2 = Condition.withAttributes(ConditionType.RESTRUCTURING, 10.0, 1, 0.0);

        const journey = UserJourney.builder(UserJourneyId.of('user-4'))
            .from(newLoan).on(expressStep1).goto_(expressRoute)
            .from(expressRoute).on(toDiscount1).goto_(discount10)
            .from(newLoan).on(economyStep1).goto_(economyRoute)
            .from(economyRoute).on(toDiscount2).goto_(discount10)
            .withCurrentState(newLoan)
            .build();

        const cheapest = journey.optimizedWayToAchieve(ProductType.DISCOUNT, c => c.getCost());
        const fastest = journey.optimizedWayToAchieve(ProductType.DISCOUNT, c => c.getTime());

        expect(cheapest).not.toBeNull();
        expect(fastest).not.toBeNull();

        expect(cheapest!.conditions.some(c => c.equals(economyStep1))).toBe(true);
        expect(fastest!.conditions.some(c => c.equals(expressStep1))).toBe(true);
    });
});
