export enum ConditionType {
    LATE_PAYMENT = 'LATE_PAYMENT',
    PAYMENT_ON_TIME = 'PAYMENT_ON_TIME',
    RESTRUCTURING = 'RESTRUCTURING',
    PROMOTION_APPROVED = 'PROMOTION_APPROVED',
}

export class Condition {
    readonly type: ConditionType;
    readonly attributes: ReadonlyMap<string, unknown>;

    constructor(type: ConditionType, attributes: Map<string, unknown> = new Map()) {
        this.type = type;
        this.attributes = new Map(attributes);
    }

    static of(type: ConditionType, attributes?: Map<string, unknown>): Condition {
        return new Condition(type, attributes ?? new Map());
    }

    static latePayments(count: number): Condition {
        return new Condition(ConditionType.LATE_PAYMENT, new Map([['counter', count]]));
    }

    static paymentOnTime(): Condition {
        return new Condition(ConditionType.PAYMENT_ON_TIME);
    }

    static restructuring(): Condition {
        return new Condition(ConditionType.RESTRUCTURING);
    }

    static promotionApproved(): Condition {
        return new Condition(ConditionType.PROMOTION_APPROVED);
    }

    static withCost(type: ConditionType, cost: number): Condition {
        return new Condition(type, new Map([['cost', cost]]));
    }

    static withTime(type: ConditionType, timeInDays: number): Condition {
        return new Condition(type, new Map([['time', timeInDays]]));
    }

    static withRisk(type: ConditionType, riskScore: number): Condition {
        return new Condition(type, new Map([['risk', riskScore]]));
    }

    static withAttributes(type: ConditionType, cost: number, time: number, risk: number): Condition {
        return new Condition(type, new Map<string, unknown>([['cost', cost], ['time', time], ['risk', risk]]));
    }

    getCost(): number {
        return (this.attributes.get('cost') as number) ?? 1.0;
    }

    getTime(): number {
        return (this.attributes.get('time') as number) ?? 1;
    }

    getRisk(): number {
        return (this.attributes.get('risk') as number) ?? 0.0;
    }

    key(): string {
        const attrEntries = [...this.attributes.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        return `${this.type}|${JSON.stringify(attrEntries)}`;
    }

    equals(other: Condition): boolean {
        return this.key() === other.key();
    }
}
