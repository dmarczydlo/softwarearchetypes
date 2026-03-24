import { describe, it, expect } from 'vitest';
import { UserJourney } from './UserJourney.js';
import { UserJourneyId } from './UserJourneyId.js';
import { State } from './State.js';
import { Product, ProductType } from './Product.js';
import { Condition } from './Condition.js';
import { CustomerPath } from './CustomerPath.js';

function assertContainsPath(paths: Set<CustomerPath>, ...expectedConditions: Condition[]): void {
    let found = false;
    for (const path of paths) {
        if (path.conditions.length !== expectedConditions.length) continue;
        let matches = true;
        for (let i = 0; i < expectedConditions.length; i++) {
            if (!path.conditions[i].equals(expectedConditions[i])) {
                matches = false;
                break;
            }
        }
        if (matches) {
            found = true;
            break;
        }
    }
    expect(found, `Expected to find path with conditions: ${expectedConditions.map(c => c.key()).join(' -> ')}`).toBe(true);
}

describe('WaysToAchieve', () => {
    it('should find simple path', () => {
        const newLoan = State.of(Product.newLoan());
        const penalty = State.of(Product.penalty());
        const payOnTime6Times = Condition.latePayments(6);

        const journey = UserJourney.builder(UserJourneyId.of('user-1'))
            .from(newLoan).on(payOnTime6Times).goto_(penalty)
            .withCurrentState(newLoan)
            .build();

        const paths = journey.waysToAchieve(ProductType.PENALTY);

        expect(paths.size).toBe(1);
        const path = [...paths][0];
        expect(path.length()).toBe(1);
        expect(path.conditions.some(c => c.equals(Condition.latePayments(6)))).toBe(true);
    });

    it('should find multiple paths to discount', () => {
        const newLoan = State.of(Product.newLoan());
        const afterPayments = State.of(Product.penalty());
        const discount10 = State.of(Product.discount(10));

        const journey = UserJourney.builder(UserJourneyId.of('user-4'))
            .from(newLoan).on(Condition.paymentOnTime()).goto_(discount10)
            .from(newLoan).on(Condition.latePayments(3)).goto_(afterPayments)
            .from(afterPayments).on(Condition.promotionApproved()).goto_(discount10)
            .withCurrentState(newLoan)
            .build();

        const paths = journey.waysToAchieve(ProductType.DISCOUNT);

        expect(paths.size).toBe(2);
        assertContainsPath(paths, Condition.paymentOnTime());
        assertContainsPath(paths, Condition.latePayments(3), Condition.promotionApproved());
    });

    it('should return empty when requested state is not present', () => {
        const newLoan = State.of(Product.newLoan());
        const penalty = State.of(Product.penalty());
        const latePayment = Condition.latePayments(1);

        const journey = UserJourney.builder(UserJourneyId.of('user-5'))
            .from(newLoan).on(latePayment).goto_(penalty)
            .withCurrentState(newLoan)
            .build();

        const paths = journey.waysToAchieve(ProductType.DISCOUNT);

        expect(paths.size).toBe(0);
    });

    it('should return empty when state unreachable', () => {
        const newLoan = State.of(Product.newLoan());
        const penalty = State.of(Product.penalty());
        const discount10 = State.of(Product.discount(10));

        const latePayment = Condition.latePayments(1);
        const payOnTime = Condition.paymentOnTime();

        const journey = UserJourney.builder(UserJourneyId.of('user-7'))
            .from(newLoan).on(latePayment).goto_(penalty)
            .from(newLoan).on(payOnTime).goto_(discount10)
            .withCurrentState(penalty)
            .build();

        const paths = journey.waysToAchieve(ProductType.DISCOUNT);

        expect(paths.size).toBe(0);
    });

    it('should find complex path through multiple states', () => {
        const newLoan = State.of(Product.newLoan());
        const afterPayment1 = State.of(Product.newLoan(), Product.penalty());
        const afterPayment2 = State.of(Product.penalty());
        const discount10 = State.of(Product.discount(10));

        const step1 = Condition.paymentOnTime();
        const step2 = Condition.latePayments(1);
        const step3 = Condition.promotionApproved();

        const journey = UserJourney.builder(UserJourneyId.of('user-9'))
            .from(newLoan).on(step1).goto_(afterPayment1)
            .from(afterPayment1).on(step2).goto_(afterPayment2)
            .from(afterPayment2).on(step3).goto_(discount10)
            .withCurrentState(newLoan)
            .build();

        const paths = journey.waysToAchieve(ProductType.DISCOUNT);

        expect(paths.size).toBe(1);
        const path = [...paths][0];
        expect(path.length()).toBe(3);
    });
});
