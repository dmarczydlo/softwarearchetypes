import { Payment } from "../payment";
import { PaymentSchedule } from "../payment-schedule";
import { ToleranceStrategy } from "../tolerance/tolerance-strategy";
import { MatchResult } from "../tolerance/match-result";
import { PaymentMatch } from "./payment-match";
import { DeltaResult } from "./delta-result";
import { DeltaStatistics } from "./delta-statistics";

export class DeltaCalculator {

    private readonly toleranceStrategy: ToleranceStrategy;

    constructor(toleranceStrategy: ToleranceStrategy) {
        this.toleranceStrategy = toleranceStrategy;
    }

    calculate(planned: PaymentSchedule, actual: PaymentSchedule): DeltaResult {
        const matched: PaymentMatch[] = [];
        const unmatchedPlanned: Payment[] = [];
        const unmatchedActual: Payment[] = [...actual.payments];

        for (const plannedPayment of planned.payments) {
            const match = this.findBestMatch(plannedPayment, unmatchedActual);

            if (match !== null) {
                matched.push(match);
                for (const a of match.actual) {
                    const idx = unmatchedActual.indexOf(a);
                    if (idx !== -1) {
                        unmatchedActual.splice(idx, 1);
                    }
                }
            } else {
                unmatchedPlanned.push(plannedPayment);
            }
        }

        return new DeltaResult(
            matched,
            unmatchedPlanned,
            unmatchedActual,
            DeltaStatistics.calculate(matched, unmatchedPlanned, unmatchedActual)
        );
    }

    private findBestMatch(planned: Payment, candidates: Payment[]): PaymentMatch | null {
        for (let size = 1; size <= candidates.length; size++) {
            for (let start = 0; start <= candidates.length - size; start++) {
                const group = candidates.slice(start, start + size);
                const matchResult: MatchResult = this.toleranceStrategy.matches(planned, group);
                if (matchResult.matched) {
                    return new PaymentMatch(planned, [...group], matchResult);
                }
            }
        }
        return null;
    }
}
