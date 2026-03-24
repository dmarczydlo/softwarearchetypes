import { randomUUID } from "crypto";
import { Money } from "@softwarearchetypes/quantity";

export class PaymentProcessed {
    readonly eventId: string;
    readonly when: Date;
    readonly amount: Money;
    readonly processedAt: Date;

    constructor(eventId: string, when: Date, amount: Money, processedAt: Date) {
        this.eventId = eventId;
        this.when = when;
        this.amount = amount;
        this.processedAt = processedAt;
    }

    static of(when: Date, amount: Money, processedAt: Date): PaymentProcessed {
        return new PaymentProcessed(randomUUID(), when, amount, processedAt);
    }
}
