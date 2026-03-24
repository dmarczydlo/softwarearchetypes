import { randomUUID } from 'crypto';

export class WaitListEntryId {
    readonly id: string;

    constructor(id: string) {
        if (id == null) throw new Error('WaitListEntryId cannot be null');
        this.id = id;
    }

    static random(): WaitListEntryId {
        return new WaitListEntryId(randomUUID());
    }

    static of(id: string): WaitListEntryId {
        return new WaitListEntryId(id);
    }

    equals(other: WaitListEntryId): boolean {
        return this.id === other.id;
    }
}
