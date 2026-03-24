import { PlannedProduction } from "../planned-production";
import { ProductionPlan } from "../production-plan";
import { ActualProduction } from "../actual-production";
import { ToleranceStrategy } from "../tolerance/tolerance-strategy";
import { MatchResult } from "../tolerance/match-result";
import { ProductionMatch } from "./production-match";
import { DeltaResult } from "./delta-result";
import { DeltaStatistics } from "./delta-statistics";

/**
 * Calculates the delta between production plan and actual execution.
 * Pure numerical comparison using algebra of delta.
 */
export class DeltaCalculator {

    private readonly toleranceStrategy: ToleranceStrategy;

    constructor(toleranceStrategy: ToleranceStrategy) {
        this.toleranceStrategy = toleranceStrategy;
    }

    calculate(planned: ProductionPlan, actual: ActualProduction[]): DeltaResult {
        const matched: ProductionMatch[] = [];
        const unmatchedPlanned: PlannedProduction[] = [];
        const unmatchedActual: ActualProduction[] = [...actual];

        for (const plannedTarget of planned.targets) {
            const match = this.findBestMatch(plannedTarget, unmatchedActual);

            if (match !== null) {
                matched.push(match);
                for (const a of match.actual) {
                    const idx = unmatchedActual.indexOf(a);
                    if (idx !== -1) {
                        unmatchedActual.splice(idx, 1);
                    }
                }
            } else {
                unmatchedPlanned.push(plannedTarget);
            }
        }

        return new DeltaResult(
            matched,
            unmatchedPlanned,
            unmatchedActual,
            DeltaStatistics.calculate(matched, unmatchedPlanned, unmatchedActual)
        );
    }

    private findBestMatch(planned: PlannedProduction, candidates: ActualProduction[]): ProductionMatch | null {
        // Try matching with single production batch
        for (const candidate of candidates) {
            if (candidate.productId !== planned.productId) {
                continue;
            }
            const matchResult: MatchResult = this.toleranceStrategy.matches(planned, [candidate]);
            if (matchResult.matched) {
                return new ProductionMatch(planned, [candidate], matchResult);
            }
        }

        // Try matching with multiple batches (split production scenarios)
        const sameProductCandidates = candidates.filter(c => c.productId === planned.productId);

        for (let size = 2; size <= Math.min(5, sameProductCandidates.length); size++) {
            for (let start = 0; start <= sameProductCandidates.length - size; start++) {
                const group = sameProductCandidates.slice(start, start + size);
                const matchResult: MatchResult = this.toleranceStrategy.matches(planned, group);
                if (matchResult.matched) {
                    return new ProductionMatch(planned, [...group], matchResult);
                }
            }
        }

        return null;
    }
}
