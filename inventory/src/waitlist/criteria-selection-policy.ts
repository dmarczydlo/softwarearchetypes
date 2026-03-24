import { SelectionContext } from './selection-context';
import { WaitListEntry } from './wait-list-entry';
import { WaitListSelectionPolicy } from './wait-list-selection-policy';

export class CriteriaSelectionPolicy<T> implements WaitListSelectionPolicy<T> {
    selectNext(queue: WaitListEntry<T>[], context: SelectionContext<T>): WaitListEntry<T> | null {
        if (context.canFulfill === null) {
            throw new Error('CriteriaSelectionPolicy requires predicate in context');
        }

        for (let i = 0; i < queue.length; i++) {
            const entry = queue[i];
            if (context.canFulfill(entry.payload)) {
                queue.splice(i, 1);
                return entry;
            }
        }

        return null;
    }
}
