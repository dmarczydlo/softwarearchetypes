import { AccountId } from './account-id.js';
import { Entry } from './entry.js';
import { EntryId } from './entry-id.js';

export interface EntryRepository {
    find(entryId: EntryId): Entry | null;
    save(entry: Entry): void;
    findAllFor(accountId: AccountId): Entry[];
    findMatching(predicate: ((entry: Entry) => boolean) | null, comparator: ((a: Entry, b: Entry) => number) | null): Entry | null;
    findAllMatching(predicate: ((entry: Entry) => boolean) | null): Entry[];
    findEntriesReferencing(entry: Entry): Entry[];
}

export class InMemoryEntryRepository implements EntryRepository {
    private readonly entries = new Map<string, Entry>();

    find(entryId: EntryId): Entry | null {
        return this.entries.get(entryId.value) ?? null;
    }

    save(entry: Entry): void {
        this.entries.set(entry.id().value, entry);
    }

    findAllFor(accountId: AccountId): Entry[] {
        return this.findAllMatching(it => it.accountId().uuid === accountId.uuid);
    }

    findMatching(predicate: ((entry: Entry) => boolean) | null, comparator: ((a: Entry, b: Entry) => number) | null): Entry | null {
        let stream = Array.from(this.entries.values());
        if (predicate != null) {
            stream = stream.filter(predicate);
        }
        if (comparator != null) {
            stream = stream.sort(comparator);
        }
        return stream.length > 0 ? stream[0] : null;
    }

    findEntriesReferencing(entry: Entry): Entry[] {
        return this.findAllMatching(
            e => {
                const appliedTo = e.appliedTo();
                return appliedTo != null && appliedTo.equals(entry.id());
            }
        );
    }

    findAllMatching(predicate: ((entry: Entry) => boolean) | null): Entry[] {
        let stream = Array.from(this.entries.values());
        if (predicate != null) {
            stream = stream.filter(predicate);
        }
        return stream;
    }
}
