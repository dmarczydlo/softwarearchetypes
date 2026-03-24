import { Payment } from "../payment";
import { PaymentSchedule } from "../payment-schedule";
import { DeltaResult } from "../delta/delta-result";
import { PaymentScheduleModifier } from "./payment-schedule-modifier";

export class RemoveInstallmentModifier implements PaymentScheduleModifier {

    private readonly installmentIndex: number;

    constructor(installmentIndex: number) {
        if (installmentIndex < 0) {
            throw new Error("installmentIndex must be >= 0");
        }
        this.installmentIndex = installmentIndex;
    }

    modify(current: PaymentSchedule, _deltaResult: DeltaResult): PaymentSchedule {
        if (current.isEmpty() || this.installmentIndex >= current.size()) {
            return current;
        }

        const newPayments: Payment[] = [];
        for (let i = 0; i < current.payments.length; i++) {
            if (i !== this.installmentIndex) {
                newPayments.push(current.payments[i]);
            }
        }

        return PaymentSchedule.of(newPayments);
    }
}
