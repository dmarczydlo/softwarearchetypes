import { Money } from "@softwarearchetypes/quantity";
import { Payment } from "../payment";
import { MatchResult } from "./match-result";
import { ToleranceStrategy } from "./tolerance-strategy";

export class PartialPaymentsStrategy implements ToleranceStrategy {

    private readonly tolerance: Money;
    private readonly deadline: Date;

    constructor(tolerance: Money, deadline: Date) {
        if (tolerance.isNegative()) {
            throw new Error("Money tolerance must be non-negative");
        }
        this.tolerance = tolerance;
        this.deadline = deadline;
    }

    matches(planned: Payment, actual: Payment[]): MatchResult {
        const totalActual = actual
            .filter(p => p.when.getTime() <= this.deadline.getTime())
            .map(p => p.amount)
            .reduce((sum, a) => sum.add(a), Money.zeroPln());

        const difference = planned.amount.subtract(totalActual).abs();

        if (difference.isGreaterThan(this.tolerance)) {
            return MatchResult.notMatched(
                `Partial payments sum ${totalActual} differs from planned ${planned.amount} by ${difference} which exceeds tolerance ${this.tolerance}`
            );
        }

        const paymentsAfterDeadline = actual.filter(p => p.when.getTime() > this.deadline.getTime()).length;

        if (paymentsAfterDeadline > 0) {
            return MatchResult.matchedResult(
                `Partial payments within tolerance: ${actual.length} payments totaling ${totalActual} (${paymentsAfterDeadline} after deadline excluded)`
            );
        }

        return MatchResult.matchedResult(
            `Partial payments within tolerance: ${actual.length} payments totaling ${totalActual}`
        );
    }
}
