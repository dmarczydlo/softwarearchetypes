import { randomUUID } from 'crypto';

export class OrderId {
    readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    static of(value: string): OrderId {
        return new OrderId(value);
    }

    static generate(): OrderId {
        return new OrderId(randomUUID());
    }

    equals(other: OrderId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
