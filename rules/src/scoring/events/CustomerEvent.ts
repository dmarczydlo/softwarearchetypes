export class CustomerEvent {
    readonly type: string;
    readonly occurredAt: Date;
    readonly amount: number;

    constructor(type: string, occurredAt: Date, amount: number) {
        this.type = type;
        this.occurredAt = occurredAt;
        this.amount = amount;
    }
}
