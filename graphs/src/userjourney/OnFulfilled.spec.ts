import { describe, it, expect } from 'vitest';
import { UserJourney } from './UserJourney.js';
import { UserJourneyId } from './UserJourneyId.js';
import { State } from './State.js';
import { Product } from './Product.js';
import { Condition } from './Condition.js';

describe('OnFulfilled', () => {
    it('should transition to new state when condition fulfilled', () => {
        const newLoan = State.of(Product.newLoan());
        const afterPayment = State.of(Product.penalty());
        const paymentOnTime = Condition.paymentOnTime();

        const journey = UserJourney.builder(UserJourneyId.of('user-1'))
            .from(newLoan).on(paymentOnTime).goto_(afterPayment)
            .withCurrentState(newLoan)
            .build();

        const updatedJourney = journey.onFulfilled(paymentOnTime);

        expect(updatedJourney.currentState().equals(afterPayment)).toBe(true);
    });

    it('should chain multiple transitions', () => {
        const state1 = State.of(Product.newLoan());
        const state2 = State.of(Product.penalty());
        const state3 = State.of(Product.discount(10));

        const step1 = Condition.paymentOnTime();
        const step2 = Condition.promotionApproved();

        const journey = UserJourney.builder(UserJourneyId.of('user-2'))
            .from(state1).on(step1).goto_(state2)
            .from(state2).on(step2).goto_(state3)
            .withCurrentState(state1)
            .build();

        const afterStep1 = journey.onFulfilled(step1);
        const afterStep2 = afterStep1.onFulfilled(step2);

        expect(afterStep1.currentState().equals(state2)).toBe(true);
        expect(afterStep2.currentState().equals(state3)).toBe(true);
    });

    it('should return same journey when condition not found', () => {
        const newLoan = State.of(Product.newLoan());
        const afterPayment = State.of(Product.penalty());
        const paymentOnTime = Condition.paymentOnTime();
        const nonExistentCondition = Condition.latePayments(5);

        const journey = UserJourney.builder(UserJourneyId.of('user-3'))
            .from(newLoan).on(paymentOnTime).goto_(afterPayment)
            .withCurrentState(newLoan)
            .build();

        const result = journey.onFulfilled(nonExistentCondition);

        expect(result.currentState().equals(journey.currentState())).toBe(true);
    });

    it('should handle multiple outgoing edges', () => {
        const newLoan = State.of(Product.newLoan());
        const penaltyState = State.of(Product.penalty());
        const discountState = State.of(Product.discount(5));

        const latePayment = Condition.latePayments(1);
        const onTimePayment = Condition.paymentOnTime();

        const journey = UserJourney.builder(UserJourneyId.of('user-5'))
            .from(newLoan).on(latePayment).goto_(penaltyState)
            .from(newLoan).on(onTimePayment).goto_(discountState)
            .withCurrentState(newLoan)
            .build();

        const afterLatePayment = journey.onFulfilled(latePayment);
        const afterOnTimePayment = journey.onFulfilled(onTimePayment);

        expect(afterLatePayment.currentState().equals(penaltyState)).toBe(true);
        expect(afterOnTimePayment.currentState().equals(discountState)).toBe(true);
    });

    it('should build complex journey with transitions', () => {
        const newLoan = State.of(Product.newLoan());
        const afterPayment1 = State.of(Product.newLoan(), Product.penalty());
        const afterPayment2 = State.of(Product.penalty());
        const discountState = State.of(Product.discount(10));

        const step1 = Condition.paymentOnTime();
        const step2 = Condition.latePayments(1);
        const step3 = Condition.promotionApproved();

        const journey = UserJourney.builder(UserJourneyId.of('user-7'))
            .from(newLoan).on(step1).goto_(afterPayment1)
            .from(afterPayment1).on(step2).goto_(afterPayment2)
            .from(afterPayment2).on(step3).goto_(discountState)
            .withCurrentState(newLoan)
            .build();

        const finalJourney = journey
            .onFulfilled(step1)
            .onFulfilled(step2)
            .onFulfilled(step3);

        expect(finalJourney.currentState().equals(discountState)).toBe(true);
    });
});
