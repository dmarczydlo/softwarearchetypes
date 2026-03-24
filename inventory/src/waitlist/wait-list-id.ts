import { randomUUID } from 'crypto';

export class WaitListId {
    readonly id: string;

    constructor(id: string) {
        if (id == null) throw new Error('WaitListId cannot be null');
        this.id = id;
    }

    static random(): WaitListId {
        return new WaitListId(randomUUID());
    }

    static of(id: string): WaitListId {
        return new WaitListId(id);
    }

    equals(other: WaitListId): boolean {
        return this.id === other.id;
    }
}
