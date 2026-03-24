import { SelectionContext } from './selection-context';
import { WaitListEntry } from './wait-list-entry';
import { WaitListSelectionPolicy } from './wait-list-selection-policy';

export class FifoSelectionPolicy<T> implements WaitListSelectionPolicy<T> {
    selectNext(queue: WaitListEntry<T>[], _context: SelectionContext<T>): WaitListEntry<T> | null {
        if (queue.length === 0) return null;
        return queue.shift()!;
    }
}
