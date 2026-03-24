import { PlannedProduction } from "../planned-production";
import { ActualProduction } from "../actual-production";
import { ScheduleModificationCondition } from "../modification/schedule-modification-condition";
import { isUnderProductionCondition } from "../modification/under-production-condition";
import { ProductionMatch } from "./production-match";
import { DeltaStatistics } from "./delta-statistics";

/**
 * The result of comparing production plan with actual execution.
 * This is the DELTA - first-class citizen representing numerical comparison.
 */
export class DeltaResult {
    readonly matched: ProductionMatch[];
    readonly unmatchedPlanned: PlannedProduction[];
    readonly unmatchedActual: ActualProduction[];
    readonly statistics: DeltaStatistics;

    constructor(
        matched: ProductionMatch[],
        unmatchedPlanned: PlannedProduction[],
        unmatchedActual: ActualProduction[],
        statistics: DeltaStatistics
    ) {
        this.matched = matched;
        this.unmatchedPlanned = unmatchedPlanned;
        this.unmatchedActual = unmatchedActual;
        this.statistics = statistics;
    }

    isPerfectMatch(): boolean {
        return this.unmatchedPlanned.length === 0
            && this.unmatchedActual.length === 0
            && this.matched.every(m => m.quantityDeviation() === 0);
    }

    hasUnderProduction(): boolean {
        return this.unmatchedPlanned.length > 0 || this.matched.some(m => m.isUnderProduced());
    }

    hasOverProduction(): boolean {
        return this.unmatchedActual.length > 0 || this.matched.some(m => m.isOverProduced());
    }

    totalPlannedProducts(): number {
        return this.matched.length + this.unmatchedPlanned.length;
    }

    matchRate(): number {
        if (this.totalPlannedProducts() === 0) {
            return 0.0;
        }
        return this.matched.length / this.totalPlannedProducts();
    }

    /**
     * Checks if this delta fulfills a given modification condition.
     * Different interpretations of the same numerical delta!
     */
    fulfills(condition: ScheduleModificationCondition): boolean {
        if (isUnderProductionCondition(condition)) {
            return this.statistics.totalUnderProducedQuantity >= condition.minQuantity;
        }
        return false;
    }

    toString(): string {
        return `Delta[matched=${this.matched.length}, unmatched planned=${this.unmatchedPlanned.length}, unmatched actual=${this.unmatchedActual.length}, ${this.statistics}]`;
    }
}
