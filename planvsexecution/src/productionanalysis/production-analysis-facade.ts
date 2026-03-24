import { DeltaCalculator } from "./delta/delta-calculator";
import { DeltaResult } from "./delta/delta-result";
import { ToleranceStrategy } from "./tolerance/tolerance-strategy";
import { ProductionPlan } from "./production-plan";
import { ActualProduction } from "./actual-production";

/**
 * Facade for production analysis.
 * Orchestrates the delta calculation - pure numerical comparison.
 */
export class ProductionAnalysisFacade {

    analyze(
        planned: ProductionPlan,
        actual: ActualProduction[],
        tolerance: ToleranceStrategy
    ): DeltaResult {
        const calculator = new DeltaCalculator(tolerance);
        return calculator.calculate(planned, actual);
    }
}
