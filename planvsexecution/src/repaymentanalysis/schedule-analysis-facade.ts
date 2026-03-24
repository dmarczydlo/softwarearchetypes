import { DeltaCalculator } from "./delta/delta-calculator";
import { DeltaResult } from "./delta/delta-result";
import { ToleranceStrategy } from "./tolerance/tolerance-strategy";
import { PaymentSchedule } from "./payment-schedule";
import { PaymentProcessed } from "./payment-processed";

export class ScheduleAnalysisFacade {

    analyzeFromEvents(
        planned: PaymentSchedule,
        events: PaymentProcessed[],
        tolerance: ToleranceStrategy
    ): DeltaResult {
        return this.analyze(planned, PaymentSchedule.fromEvents(events), tolerance);
    }

    analyze(
        planned: PaymentSchedule,
        actual: PaymentSchedule,
        tolerance: ToleranceStrategy
    ): DeltaResult {
        const calculator = new DeltaCalculator(tolerance);
        return calculator.calculate(planned, actual);
    }
}
