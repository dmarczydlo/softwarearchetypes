import { PlannedProduction } from "../planned-production";
import { ActualProduction } from "../actual-production";
import { MatchResult } from "./match-result";
import { ToleranceStrategy } from "./tolerance-strategy";

/**
 * Combines multiple tolerance strategies.
 * All strategies must match for the result to be considered a match.
 */
export class CombinedTolerance implements ToleranceStrategy {

    private readonly strategies: ToleranceStrategy[];

    constructor(strategies: ToleranceStrategy[]) {
        this.strategies = [...strategies];
    }

    matches(planned: PlannedProduction, actual: ActualProduction[]): MatchResult {
        for (const strategy of this.strategies) {
            const result = strategy.matches(planned, actual);
            if (!result.matched) {
                return result;
            }
        }
        return MatchResult.matchedResult("All tolerance strategies matched");
    }
}
