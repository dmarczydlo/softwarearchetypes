export class ReverseTransactionCommand {
    readonly refTransactionId: string;
    readonly occurredAt: Date;
    readonly appliesAt: Date;

    constructor(refTransactionId: string, occurredAt: Date, appliesAt: Date) {
        this.refTransactionId = refTransactionId;
        this.occurredAt = occurredAt;
        this.appliesAt = appliesAt;
    }
}
