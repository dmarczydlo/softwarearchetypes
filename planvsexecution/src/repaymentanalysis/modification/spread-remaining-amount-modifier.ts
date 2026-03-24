import { Money } from "@softwarearchetypes/quantity";
import { Payment } from "../payment";
import { PaymentSchedule } from "../payment-schedule";
import { DeltaResult } from "../delta/delta-result";
import { PaymentScheduleModifier } from "./payment-schedule-modifier";

export class SpreadRemainingAmountModifier implements PaymentScheduleModifier {

    private readonly newInstallmentCount: number;

    constructor(newInstallmentCount: number) {
        if (newInstallmentCount <= 0) {
            throw new Error("newInstallmentCount must be > 0");
        }
        this.newInstallmentCount = newInstallmentCount;
    }

    modify(current: PaymentSchedule, deltaResult: DeltaResult): PaymentSchedule {
        const paidInstallmentsCount = deltaResult.matched.length;

        if (current.isEmpty() || paidInstallmentsCount >= current.size()) {
            return current;
        }

        const before = current.take(paidInstallmentsCount);
        const remaining = current.skip(paidInstallmentsCount);

        const remainingAmount = remaining.totalAmount();
        const [baseInstallmentAmount, remainder] = remainingAmount.divideAndRemainder(this.newInstallmentCount);

        const firstRemainingDate = remaining.first().when;
        const lastRemainingDate = remaining.last().when;

        let intervalMs: number;
        if (this.newInstallmentCount === 1) {
            intervalMs = 0;
        } else {
            const totalDuration = lastRemainingDate.getTime() - firstRemainingDate.getTime();
            intervalMs = totalDuration / (this.newInstallmentCount - 1);
        }

        const newPayments: Payment[] = [...before.payments];
        for (let i = 0; i < this.newInstallmentCount; i++) {
            const date = new Date(firstRemainingDate.getTime() + intervalMs * i);
            const installmentAmount: Money = (i === this.newInstallmentCount - 1)
                ? baseInstallmentAmount.add(remainder)
                : baseInstallmentAmount;
            newPayments.push(Payment.of(date, installmentAmount));
        }

        return PaymentSchedule.of(newPayments);
    }
}
