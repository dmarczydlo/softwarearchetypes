import { PlannedProduction } from "../planned-production";
import { ActualProduction } from "../actual-production";
import { MatchResult } from "../tolerance/match-result";

/**
 * Represents a match between planned and actual production.
 * This is part of the DELTA - the comparison result.
 */
export class ProductionMatch {
    readonly planned: PlannedProduction;
    readonly actual: ActualProduction[];
    readonly matchResult: MatchResult;

    constructor(planned: PlannedProduction, actual: ActualProduction[], matchResult: MatchResult) {
        this.planned = planned;
        this.actual = actual;
        this.matchResult = matchResult;
    }

    totalProducedQuantity(): number {
        return this.actual.reduce((sum, a) => sum + a.producedQuantity, 0);
    }

    quantityDeviation(): number {
        return this.totalProducedQuantity() - this.planned.targetQuantity;
    }

    isUnderProduced(): boolean {
        return this.totalProducedQuantity() < this.planned.targetQuantity;
    }

    isOverProduced(): boolean {
        return this.totalProducedQuantity() > this.planned.targetQuantity;
    }

    toString(): string {
        return `Match[${this.planned.productId}: ${this.actual.length} actual batches, qty: ${this.totalProducedQuantity()}/${this.planned.targetQuantity} units]`;
    }
}
