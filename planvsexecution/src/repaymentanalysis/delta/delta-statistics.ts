import { Money } from "@softwarearchetypes/quantity";
import { Payment } from "../payment";
import { PaymentMatch } from "./payment-match";

export class DeltaStatistics {
    readonly totalPlannedAmount: Money;
    readonly totalActualAmount: Money;
    readonly totalMatchedAmount: Money;
    readonly totalUnderpaidAmount: Money;
    readonly totalOverpaidAmount: Money;
    readonly plannedCount: number;
    readonly actualCount: number;
    readonly matchedCount: number;
    readonly underpaidCount: number;
    readonly overpaidCount: number;
    readonly onTimeCount: number;
    readonly lateCount: number;

    constructor(
        totalPlannedAmount: Money,
        totalActualAmount: Money,
        totalMatchedAmount: Money,
        totalUnderpaidAmount: Money,
        totalOverpaidAmount: Money,
        plannedCount: number,
        actualCount: number,
        matchedCount: number,
        underpaidCount: number,
        overpaidCount: number,
        onTimeCount: number,
        lateCount: number
    ) {
        this.totalPlannedAmount = totalPlannedAmount;
        this.totalActualAmount = totalActualAmount;
        this.totalMatchedAmount = totalMatchedAmount;
        this.totalUnderpaidAmount = totalUnderpaidAmount;
        this.totalOverpaidAmount = totalOverpaidAmount;
        this.plannedCount = plannedCount;
        this.actualCount = actualCount;
        this.matchedCount = matchedCount;
        this.underpaidCount = underpaidCount;
        this.overpaidCount = overpaidCount;
        this.onTimeCount = onTimeCount;
        this.lateCount = lateCount;
    }

    static calculate(
        matched: PaymentMatch[],
        unmatchedPlanned: Payment[],
        unmatchedActual: Payment[]
    ): DeltaStatistics {
        const sumPayments = (payments: Payment[]): Money =>
            payments.map(p => p.amount).reduce((sum, a) => sum.add(a), Money.zeroPln());

        const totalPlanned = sumPayments(matched.map(m => m.planned))
            .add(sumPayments(unmatchedPlanned));

        const totalActual = matched
            .map(m => m.totalActualAmount())
            .reduce((sum, a) => sum.add(a), Money.zeroPln())
            .add(sumPayments(unmatchedActual));

        const totalMatched = matched
            .map(m => m.totalActualAmount())
            .reduce((sum, a) => sum.add(a), Money.zeroPln());

        const totalUnderpaid = sumPayments(unmatchedPlanned);
        const totalOverpaid = sumPayments(unmatchedActual);

        const onTime = matched.filter(m =>
            m.actual.every(p => p.when.getTime() <= m.planned.when.getTime())
        ).length;

        const late = matched.filter(m =>
            m.actual.some(p => p.when.getTime() > m.planned.when.getTime())
        ).length;

        return new DeltaStatistics(
            totalPlanned,
            totalActual,
            totalMatched,
            totalUnderpaid,
            totalOverpaid,
            matched.length + unmatchedPlanned.length,
            matched.length + unmatchedActual.length,
            matched.length,
            unmatchedPlanned.length,
            unmatchedActual.length,
            onTime,
            late
        );
    }

    netDifference(): Money {
        return this.totalActualAmount.subtract(this.totalPlannedAmount);
    }
}
