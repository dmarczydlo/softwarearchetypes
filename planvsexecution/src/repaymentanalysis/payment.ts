import { Money } from "@softwarearchetypes/quantity";

/**
 * A payment with date and amount.
 */
export class Payment {
    readonly when: Date;
    readonly amount: Money;

    constructor(when: Date, amount: Money) {
        if (when === null || when === undefined) {
            throw new Error("Payment date cannot be null");
        }
        if (amount === null || amount === undefined) {
            throw new Error("Payment amount cannot be null");
        }
        this.when = when;
        this.amount = amount;
    }

    static of(when: Date, amount: Money): Payment {
        return new Payment(when, amount);
    }

    compareTo(other: Payment): number {
        return this.when.getTime() - other.when.getTime();
    }
}
