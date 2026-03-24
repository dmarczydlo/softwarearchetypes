import { PlannedProduction } from "../planned-production";
import { ActualProduction } from "../actual-production";
import { MatchResult } from "./match-result";

/**
 * Strategy for matching planned against actual production.
 * Different strategies = different interpretations of the same delta!
 * Pure numerical comparison.
 */
export interface ToleranceStrategy {
    matches(planned: PlannedProduction, actual: ActualProduction[]): MatchResult;
}
