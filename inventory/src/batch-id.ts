import { randomUUID } from 'crypto';

export class BatchId {
    readonly value: string;

    constructor(value: string) {
        if (value == null) {
            throw new Error('BatchId value cannot be null');
        }
        this.value = value;
    }

    static random(): BatchId {
        return new BatchId(randomUUID());
    }

    static of(value: string): BatchId {
        return new BatchId(value);
    }

    equals(other: BatchId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
