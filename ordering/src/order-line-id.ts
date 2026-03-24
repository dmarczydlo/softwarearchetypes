import { randomUUID } from 'crypto';

export class OrderLineId {
    readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    static of(value: string): OrderLineId {
        return new OrderLineId(value);
    }

    static generate(): OrderLineId {
        return new OrderLineId(randomUUID());
    }

    equals(other: OrderLineId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
