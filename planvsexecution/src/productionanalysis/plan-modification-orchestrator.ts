import { DeltaResult } from "./delta/delta-result";
import { ModificationRule } from "./modification/modification-rule";
import { ToleranceStrategy } from "./tolerance/tolerance-strategy";
import { ProductionAnalysisFacade } from "./production-analysis-facade";
import { ConfigurableProductionPlan } from "./configurable-production-plan";
import { ActualProduction } from "./actual-production";

/**
 * Orchestrates the analysis and modification of production plans.
 * This is where the complete plan-execution-delta cycle happens.
 */
export class PlanModificationOrchestrator {

    private readonly analysisFacade: ProductionAnalysisFacade;

    constructor(analysisFacade: ProductionAnalysisFacade) {
        this.analysisFacade = analysisFacade;
    }

    analyzeAndApply(
        configurable: ConfigurableProductionPlan,
        actual: ActualProduction[],
        tolerance: ToleranceStrategy
    ): DeltaResult {
        const result = this.analysisFacade.analyze(configurable.activePlan(), actual, tolerance);
        const fulfilledRules = this.findFulfilledRules(configurable, result);
        configurable.fulfilled(fulfilledRules, result);
        return result;
    }

    private findFulfilledRules(configurable: ConfigurableProductionPlan, result: DeltaResult): ModificationRule[] {
        const fulfilled: ModificationRule[] = [];
        for (const rule of configurable.rules()) {
            if (result.fulfills(rule.condition)) {
                fulfilled.push(rule);
            }
        }
        return fulfilled;
    }
}
