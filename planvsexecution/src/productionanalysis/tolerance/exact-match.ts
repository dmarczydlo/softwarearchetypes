import { PlannedProduction } from "../planned-production";
import { ActualProduction } from "../actual-production";
import { MatchResult } from "./match-result";
import { ToleranceStrategy } from "./tolerance-strategy";

/**
 * Exact matching - no tolerance.
 * Quantities must match exactly.
 */
export class ExactMatch implements ToleranceStrategy {

    matches(planned: PlannedProduction, actual: ActualProduction[]): MatchResult {
        if (actual.length === 0) {
            return MatchResult.notMatched("No actual production");
        }

        const totalProduced = actual.reduce((sum, a) => sum + a.producedQuantity, 0);

        if (totalProduced !== planned.targetQuantity) {
            return MatchResult.notMatched(
                `Quantity mismatch: planned ${planned.targetQuantity}, actual ${totalProduced}`
            );
        }

        return MatchResult.matchedResult("Exact quantity match");
    }
}
