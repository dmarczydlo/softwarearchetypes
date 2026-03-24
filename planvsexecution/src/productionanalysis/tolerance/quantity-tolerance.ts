import { PlannedProduction } from "../planned-production";
import { ActualProduction } from "../actual-production";
import { MatchResult } from "./match-result";
import { ToleranceStrategy } from "./tolerance-strategy";

/**
 * Tolerance strategy based on quantity deviation.
 * Allows +/-X% or +/-X units deviation.
 */
export class QuantityTolerance implements ToleranceStrategy {

    private readonly percentageTolerance: number;
    private readonly absoluteTolerance: number;

    constructor(percentageTolerance: number, absoluteTolerance: number) {
        this.percentageTolerance = percentageTolerance;
        this.absoluteTolerance = absoluteTolerance;
    }

    matches(planned: PlannedProduction, actual: ActualProduction[]): MatchResult {
        if (actual.length === 0) {
            return MatchResult.notMatched("No actual production");
        }

        const totalProduced = actual.reduce((sum, a) => sum + a.producedQuantity, 0);
        const deviation = Math.abs(totalProduced - planned.targetQuantity);

        // Check absolute tolerance
        if (deviation <= this.absoluteTolerance) {
            return MatchResult.matchedResult(
                `Within absolute tolerance: deviation ${deviation} <= ${this.absoluteTolerance}`
            );
        }

        // Check percentage tolerance
        const percentageDeviation = (deviation / planned.targetQuantity) * 100;
        if (percentageDeviation <= this.percentageTolerance) {
            return MatchResult.matchedResult(
                `Within percentage tolerance: ${percentageDeviation.toFixed(1)}% <= ${this.percentageTolerance.toFixed(1)}%`
            );
        }

        return MatchResult.notMatched(
            `Exceeds tolerance: deviation ${deviation} (${percentageDeviation.toFixed(1)}%), tolerance: ${this.absoluteTolerance} units or ${this.percentageTolerance.toFixed(1)}%`
        );
    }
}
