import { randomUUID } from 'crypto';

export class EntryId {
    readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    static generate(): EntryId {
        return new EntryId(randomUUID());
    }

    toString(): string {
        return this.value;
    }

    equals(other: EntryId): boolean {
        return this.value === other.value;
    }
}
