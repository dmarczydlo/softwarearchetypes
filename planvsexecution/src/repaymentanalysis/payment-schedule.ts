import { Money } from "@softwarearchetypes/quantity";
import { Payment } from "./payment";
import { PaymentProcessed } from "./payment-processed";

export class PaymentSchedule {
    readonly payments: Payment[];

    constructor(payments: Payment[]) {
        const dates = payments.map(p => p.when.getTime());
        const sortedDates = [...dates].sort((a, b) => a - b);
        const inOrder = dates.every((d, i) => d === sortedDates[i]);
        if (!inOrder) {
            throw new Error("Payments must be in ascending chronological order");
        }
        this.payments = [...payments];
    }

    static empty(): PaymentSchedule {
        return new PaymentSchedule([]);
    }

    static of(payments: Payment[]): PaymentSchedule {
        const sorted = [...payments].sort((a, b) => a.when.getTime() - b.when.getTime());
        return new PaymentSchedule(sorted);
    }

    static fromEvents(events: PaymentProcessed[]): PaymentSchedule {
        return PaymentSchedule.of(
            events.map(e => Payment.of(e.when, e.amount))
        );
    }

    totalAmount(): Money {
        return this.payments
            .map(p => p.amount)
            .reduce((sum, a) => sum.add(a), Money.zeroPln());
    }

    size(): number {
        return this.payments.length;
    }

    isEmpty(): boolean {
        return this.payments.length === 0;
    }

    skip(count: number): PaymentSchedule {
        if (count >= this.payments.length) {
            return PaymentSchedule.empty();
        }
        return new PaymentSchedule(this.payments.slice(count));
    }

    take(count: number): PaymentSchedule {
        if (count >= this.payments.length) {
            return this;
        }
        return new PaymentSchedule(this.payments.slice(0, count));
    }

    first(): Payment {
        if (this.payments.length === 0) {
            throw new Error("Schedule is empty");
        }
        return this.payments[0];
    }

    last(): Payment {
        if (this.payments.length === 0) {
            throw new Error("Schedule is empty");
        }
        return this.payments[this.payments.length - 1];
    }

    equals(other: PaymentSchedule): boolean {
        if (this.payments.length !== other.payments.length) return false;
        return this.payments.every((p, i) =>
            p.when.getTime() === other.payments[i].when.getTime()
            && p.amount.equals(other.payments[i].amount)
        );
    }
}
