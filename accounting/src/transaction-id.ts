import { randomUUID } from 'crypto';

export class TransactionId {
    readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    static generate(): TransactionId {
        return new TransactionId(randomUUID());
    }

    static of(uuid: string): TransactionId {
        return new TransactionId(uuid);
    }

    toString(): string {
        return this.value;
    }

    equals(other: TransactionId): boolean {
        return this.value === other.value;
    }
}
