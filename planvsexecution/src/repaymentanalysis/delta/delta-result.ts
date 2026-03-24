import { Payment } from "../payment";
import { ScheduleModificationCondition } from "../modification/schedule-modification-condition";
import { isLatePaymentCondition } from "../modification/late-payment-condition";
import { isOnTimePaymentCondition } from "../modification/on-time-payment-condition";
import { PaymentMatch } from "./payment-match";
import { DeltaStatistics } from "./delta-statistics";

export class DeltaResult {
    readonly matched: PaymentMatch[];
    readonly unmatchedPlanned: Payment[];
    readonly unmatchedActual: Payment[];
    readonly statistics: DeltaStatistics;

    constructor(
        matched: PaymentMatch[],
        unmatchedPlanned: Payment[],
        unmatchedActual: Payment[],
        statistics: DeltaStatistics
    ) {
        this.matched = matched;
        this.unmatchedPlanned = unmatchedPlanned;
        this.unmatchedActual = unmatchedActual;
        this.statistics = statistics;
    }

    isPerfectMatch(): boolean {
        return this.unmatchedPlanned.length === 0 && this.unmatchedActual.length === 0;
    }

    hasUnderpayments(): boolean {
        return this.unmatchedPlanned.length > 0;
    }

    hasOverpayments(): boolean {
        return this.unmatchedActual.length > 0;
    }

    totalPlannedCount(): number {
        return this.matched.length + this.unmatchedPlanned.length;
    }

    matchRate(): number {
        if (this.totalPlannedCount() === 0) {
            return 0.0;
        }
        return this.matched.length / this.totalPlannedCount();
    }

    fulfills(condition: ScheduleModificationCondition): boolean {
        if (isLatePaymentCondition(condition)) {
            return this.statistics.lateCount >= condition.minCount;
        }
        if (isOnTimePaymentCondition(condition)) {
            return this.statistics.onTimeCount >= condition.minCount;
        }
        return false;
    }
}
