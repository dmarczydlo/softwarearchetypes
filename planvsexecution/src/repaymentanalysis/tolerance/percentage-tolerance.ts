import { Money, Percentage } from "@softwarearchetypes/quantity";
import { Payment } from "../payment";
import { MatchResult } from "./match-result";
import { ToleranceStrategy } from "./tolerance-strategy";

export class PercentageTolerance implements ToleranceStrategy {

    private readonly tolerance: Percentage;

    constructor(tolerance: Percentage) {
        this.tolerance = tolerance;
    }

    matches(planned: Payment, actual: Payment[]): MatchResult {
        const totalActual = actual
            .map(p => p.amount)
            .reduce((sum, a) => sum.add(a), Money.zeroPln());

        if (planned.amount.isZero()) {
            if (totalActual.isZero()) {
                return MatchResult.matchedResult("Both amounts are zero");
            }
            return MatchResult.notMatched("Planned was zero but actual was " + totalActual);
        }

        const maxDeviation = planned.amount.multiply(this.tolerance);
        const difference = planned.amount.subtract(totalActual).abs();

        if (difference.isGreaterThan(maxDeviation)) {
            const percentValue = (difference.value() / planned.amount.value()) * 100;
            const actualPercentage = Percentage.of(percentValue);
            return MatchResult.notMatched(
                `Amount difference ${actualPercentage} exceeds tolerance ${this.tolerance}`
            );
        }

        return MatchResult.matchedResult(
            `Amount within ${this.tolerance} tolerance`
        );
    }
}
