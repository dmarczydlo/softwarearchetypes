import { Money } from "@softwarearchetypes/quantity";
import { Payment } from "../payment";
import { MatchResult } from "./match-result";
import { ToleranceStrategy } from "./tolerance-strategy";

export class MoneyTolerance implements ToleranceStrategy {

    private readonly tolerance: Money;

    constructor(tolerance: Money) {
        if (tolerance.isNegative()) {
            throw new Error("Money tolerance must be non-negative");
        }
        this.tolerance = tolerance;
    }

    matches(planned: Payment, actual: Payment[]): MatchResult {
        const totalActual = actual
            .map(p => p.amount)
            .reduce((sum, a) => sum.add(a), Money.zeroPln());

        const difference = planned.amount.subtract(totalActual).abs();

        if (difference.isGreaterThan(this.tolerance)) {
            return MatchResult.notMatched(
                `Amount difference ${difference} exceeds tolerance ${this.tolerance}`
            );
        }

        return MatchResult.matchedResult(
            `Amount within tolerance: difference ${difference} <= ${this.tolerance}`
        );
    }
}
