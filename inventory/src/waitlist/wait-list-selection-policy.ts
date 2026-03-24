import { SelectionContext } from './selection-context';
import { WaitListEntry } from './wait-list-entry';

export interface WaitListSelectionPolicy<T> {
    selectNext(queue: WaitListEntry<T>[], context: SelectionContext<T>): WaitListEntry<T> | null;
}
