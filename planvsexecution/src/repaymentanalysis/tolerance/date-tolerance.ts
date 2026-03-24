import { Payment } from "../payment";
import { MatchResult } from "./match-result";
import { ToleranceStrategy } from "./tolerance-strategy";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class DateTolerance implements ToleranceStrategy {

    private readonly toleranceDays: number;

    constructor(toleranceDays: number) {
        if (toleranceDays < 0) {
            throw new Error("Date tolerance must be non-negative");
        }
        this.toleranceDays = toleranceDays;
    }

    matches(planned: Payment, actual: Payment[]): MatchResult {
        const allWithinTolerance = actual.every(p => {
            const daysDiff = Math.abs(
                Math.floor((planned.when.getTime() - p.when.getTime()) / MS_PER_DAY)
            );
            return daysDiff <= this.toleranceDays;
        });

        if (!allWithinTolerance) {
            return MatchResult.notMatched(
                "Some payments exceed date tolerance of " + this.toleranceDays + " days"
            );
        }

        return MatchResult.matchedResult(
            "All payments within date tolerance: " + this.toleranceDays + " days"
        );
    }
}
