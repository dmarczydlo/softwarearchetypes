import { DeltaResult } from "./delta/delta-result";
import { ModificationRule } from "./modification/modification-rule";
import { ToleranceStrategy } from "./tolerance/tolerance-strategy";
import { ScheduleAnalysisFacade } from "./schedule-analysis-facade";
import { ConfigurablePaymentSchedule } from "./configurable-payment-schedule";
import { PaymentProcessed } from "./payment-processed";
import { PaymentSchedule } from "./payment-schedule";

export class ScheduleModificationOrchestrator {

    private readonly analysisFacade: ScheduleAnalysisFacade;

    constructor(analysisFacade: ScheduleAnalysisFacade) {
        this.analysisFacade = analysisFacade;
    }

    analyzeFromEvents(
        plan: ConfigurablePaymentSchedule,
        events: PaymentProcessed[],
        tolerance: ToleranceStrategy
    ): DeltaResult {
        return this.analysisFacade.analyzeFromEvents(plan.activeSchedule(), events, tolerance);
    }

    analyze(
        configurable: ConfigurablePaymentSchedule,
        actual: PaymentSchedule,
        tolerance: ToleranceStrategy
    ): DeltaResult {
        return this.analysisFacade.analyze(configurable.activeSchedule(), actual, tolerance);
    }

    analyzeAndApplyFromEvents(
        plan: ConfigurablePaymentSchedule,
        events: PaymentProcessed[],
        tolerance: ToleranceStrategy
    ): DeltaResult {
        const result = this.analyzeFromEvents(plan, events, tolerance);
        const fulfilledRules = this.findFulfilledRules(plan, result);
        plan.fulfilled(fulfilledRules, result);
        return result;
    }

    analyzeAndApply(
        configurable: ConfigurablePaymentSchedule,
        actual: PaymentSchedule,
        tolerance: ToleranceStrategy
    ): DeltaResult {
        const result = this.analyze(configurable, actual, tolerance);
        const fulfilledRules = this.findFulfilledRules(configurable, result);
        configurable.fulfilled(fulfilledRules, result);
        return result;
    }

    private findFulfilledRules(configurable: ConfigurablePaymentSchedule, result: DeltaResult): ModificationRule[] {
        const fulfilled: ModificationRule[] = [];
        for (const rule of configurable.rules()) {
            if (result.fulfills(rule.condition)) {
                fulfilled.push(rule);
            }
        }
        return fulfilled;
    }
}
