import { Payment } from "../payment";
import { MatchResult } from "./match-result";
import { ToleranceStrategy } from "./tolerance-strategy";

export class ExactMatch implements ToleranceStrategy {

    matches(planned: Payment, actual: Payment[]): MatchResult {
        if (actual.length !== 1) {
            return MatchResult.notMatched("Exact match requires single payment, got " + actual.length);
        }

        const actualPayment = actual[0];
        const amountMatches = planned.amount.equals(actualPayment.amount);
        const dateMatches = planned.when.getTime() === actualPayment.when.getTime();

        if (amountMatches && dateMatches) {
            return MatchResult.matchedResult("Exact match on amount and date");
        }

        if (!amountMatches && !dateMatches) {
            return MatchResult.notMatched(
                `Amount differs: expected ${planned.amount}, got ${actualPayment.amount}; Date differs: expected ${planned.when.toISOString()}, got ${actualPayment.when.toISOString()}`
            );
        }

        if (!amountMatches) {
            return MatchResult.notMatched(
                `Amount differs: expected ${planned.amount}, got ${actualPayment.amount}`
            );
        }

        return MatchResult.notMatched(
            `Date differs: expected ${planned.when.toISOString()}, got ${actualPayment.when.toISOString()}`
        );
    }
}
