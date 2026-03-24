import { PlannedProduction } from "../planned-production";
import { ActualProduction } from "../actual-production";
import { ProductionMatch } from "./production-match";

/**
 * Statistical summary of the delta between plan and execution.
 * Purely numerical comparison - focuses on quantities.
 */
export class DeltaStatistics {
    readonly totalUnderProducedQuantity: number;
    readonly totalOverProducedQuantity: number;
    readonly netQuantityDifference: number;
    readonly underProducedProductsCount: number;
    readonly overProducedProductsCount: number;

    constructor(
        totalUnderProducedQuantity: number,
        totalOverProducedQuantity: number,
        netQuantityDifference: number,
        underProducedProductsCount: number,
        overProducedProductsCount: number
    ) {
        this.totalUnderProducedQuantity = totalUnderProducedQuantity;
        this.totalOverProducedQuantity = totalOverProducedQuantity;
        this.netQuantityDifference = netQuantityDifference;
        this.underProducedProductsCount = underProducedProductsCount;
        this.overProducedProductsCount = overProducedProductsCount;
    }

    static calculate(
        matched: ProductionMatch[],
        unmatchedPlanned: PlannedProduction[],
        unmatchedActual: ActualProduction[]
    ): DeltaStatistics {
        const underProduced = matched
            .filter(m => m.isUnderProduced())
            .reduce((sum, m) => sum + Math.abs(m.quantityDeviation()), 0)
            + unmatchedPlanned.reduce((sum, p) => sum + p.targetQuantity, 0);

        const overProduced = matched
            .filter(m => m.isOverProduced())
            .reduce((sum, m) => sum + m.quantityDeviation(), 0)
            + unmatchedActual.reduce((sum, a) => sum + a.producedQuantity, 0);

        const netDifference = overProduced - underProduced;

        const underProducedCount = matched.filter(m => m.isUnderProduced()).length
            + unmatchedPlanned.length;

        const overProducedCount = matched.filter(m => m.isOverProduced()).length
            + unmatchedActual.length;

        return new DeltaStatistics(
            underProduced,
            overProduced,
            netDifference,
            underProducedCount,
            overProducedCount
        );
    }

    toString(): string {
        return `Stats[underProduced=${this.totalUnderProducedQuantity} units (${this.underProducedProductsCount} products), overProduced=${this.totalOverProducedQuantity} units (${this.overProducedProductsCount} products), net=${this.netQuantityDifference}]`;
    }
}
