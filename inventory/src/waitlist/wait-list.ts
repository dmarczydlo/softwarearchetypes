import { CriteriaSelectionPolicy } from './criteria-selection-policy';
import { FifoSelectionPolicy } from './fifo-selection-policy';
import { PrioritySelectionPolicy } from './priority-selection-policy';
import { SelectionContext } from './selection-context';
import { WaitListEntry } from './wait-list-entry';
import { WaitListEntryId } from './wait-list-entry-id';
import { WaitListId } from './wait-list-id';
import { WaitListSelectionPolicy } from './wait-list-selection-policy';

export class WaitList<T> {
    private readonly _id: WaitListId;
    private readonly _capacity: number;
    private readonly _queue: WaitListEntry<T>[];
    private readonly _policy: WaitListSelectionPolicy<T>;
    private readonly _usePrioritySort: boolean;

    constructor(
        id: WaitListId,
        capacity: number,
        queue: WaitListEntry<T>[],
        policy: WaitListSelectionPolicy<T>,
        usePrioritySort: boolean = false,
    ) {
        if (capacity <= 0) {
            throw new Error('Capacity must be positive');
        }
        this._id = id;
        this._capacity = capacity;
        this._queue = [...queue];
        this._policy = policy;
        this._usePrioritySort = usePrioritySort;
    }

    static fifo<T>(capacity: number): WaitList<T> {
        return new WaitList<T>(WaitListId.random(), capacity, [], new FifoSelectionPolicy<T>());
    }

    static priority<T>(capacity: number): WaitList<T> {
        return new WaitList<T>(WaitListId.random(), capacity, [], new PrioritySelectionPolicy<T>(), true);
    }

    static criteria<T>(capacity: number): WaitList<T> {
        return new WaitList<T>(WaitListId.random(), capacity, [], new CriteriaSelectionPolicy<T>());
    }

    id(): WaitListId { return this._id; }

    add(entry: WaitListEntry<T>): boolean {
        if (this._queue.length >= this._capacity) {
            throw new Error(
                `Waitlist full - capacity: ${this._capacity}, current size: ${this._queue.length}`,
            );
        }
        this._queue.push(entry);
        if (this._usePrioritySort) {
            this._queue.sort((a, b) => a.compareTo(b));
        }
        return true;
    }

    poll(): WaitListEntry<T> | null {
        return this._policy.selectNext(this._queue, SelectionContext.empty<T>());
    }

    selectNext(contextOrPredicate: SelectionContext<T> | ((item: T) => boolean)): WaitListEntry<T> | null {
        if (typeof contextOrPredicate === 'function') {
            return this._policy.selectNext(this._queue, SelectionContext.withPredicate<T>(contextOrPredicate));
        }
        return this._policy.selectNext(this._queue, contextOrPredicate);
    }

    remove(entry: WaitListEntry<T>): boolean {
        const idx = this._queue.indexOf(entry);
        if (idx !== -1) {
            this._queue.splice(idx, 1);
            return true;
        }
        return false;
    }

    removeById(entryId: WaitListEntryId): boolean {
        const idx = this._queue.findIndex(e => e.id.equals(entryId));
        if (idx !== -1) {
            this._queue.splice(idx, 1);
            return true;
        }
        return false;
    }

    peek(): WaitListEntry<T> | null {
        return this._queue.length > 0 ? this._queue[0] : null;
    }

    size(): number { return this._queue.length; }
    capacity(): number { return this._capacity; }
    isEmpty(): boolean { return this._queue.length === 0; }
    isFull(): boolean { return this._queue.length >= this._capacity; }
    availableCapacity(): number { return this._capacity - this._queue.length; }

    contains(entryId: WaitListEntryId): boolean {
        return this._queue.some(e => e.id.equals(entryId));
    }

    entries(): WaitListEntry<T>[] {
        return [...this._queue];
    }
}
