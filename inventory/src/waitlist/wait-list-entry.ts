import { WaitListEntryId } from './wait-list-entry-id';

const DEFAULT_PRIORITY = 1;

export class WaitListEntry<T> {
    readonly id: WaitListEntryId;
    readonly payload: T;
    readonly priority: number;
    readonly addedAt: Date;

    constructor(id: WaitListEntryId, payload: T, priority: number, addedAt: Date) {
        if (!id) throw new Error('id cannot be null');
        if (payload == null) throw new Error('payload cannot be null');
        if (!addedAt) throw new Error('addedAt cannot be null');
        this.id = id;
        this.payload = payload;
        this.priority = priority;
        this.addedAt = addedAt;
    }

    static of<T>(payload: T, priority?: number, addedAt?: Date): WaitListEntry<T> {
        return new WaitListEntry(
            WaitListEntryId.random(),
            payload,
            priority ?? DEFAULT_PRIORITY,
            addedAt ?? new Date(),
        );
    }

    compareTo(other: WaitListEntry<T>): number {
        const priorityComp = this.priority - other.priority;
        if (priorityComp !== 0) return priorityComp;
        return this.addedAt.getTime() - other.addedAt.getTime();
    }
}
