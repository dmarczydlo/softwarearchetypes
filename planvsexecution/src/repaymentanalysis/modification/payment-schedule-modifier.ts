import { PaymentSchedule } from "../payment-schedule";
import { DeltaResult } from "../delta/delta-result";

export interface PaymentScheduleModifier {
    modify(current: PaymentSchedule, deltaResult: DeltaResult): PaymentSchedule;
}

export function andThenModifier(first: PaymentScheduleModifier, next: PaymentScheduleModifier): PaymentScheduleModifier {
    return {
        modify(schedule: PaymentSchedule, delta: DeltaResult): PaymentSchedule {
            return next.modify(first.modify(schedule, delta), delta);
        }
    };
}
