import { AccountId } from './account-id.js';
import { Entry, AccountCredited, AccountDebited, isAccountCredited, isAccountDebited } from './entry.js';
import { EntryId } from './entry-id.js';
import { EntryRepository } from './entry-repository.js';

export class EntryAllocations {
    private readonly entryRepository: EntryRepository;

    constructor(entryRepository: EntryRepository) {
        this.entryRepository = entryRepository;
    }

    findAllocationFor(filter: EntryAllocationFilter): Entry | null {
        return this.entryRepository.findMatching(filter.predicate, filter.comparator);
    }
}

export enum EntryAllocationStrategy {
    FIFO = "FIFO",
    LIFO = "LIFO",
    MANUAL = "MANUAL"
}

export class EntryAllocationFilter {
    readonly predicate: ((entry: Entry) => boolean) | null;
    readonly comparator: ((a: Entry, b: Entry) => number) | null;

    constructor(predicate: ((entry: Entry) => boolean) | null, comparator: ((a: Entry, b: Entry) => number) | null) {
        this.predicate = predicate;
        this.comparator = comparator;
    }

    static readonly NONE = new EntryAllocationFilter(null, null);

    isEmpty(): boolean {
        return this.predicate === null && this.comparator === null;
    }
}

export type EntryClass = 'credited' | 'debited';

export class EntryAllocationFilterBuilder {
    private strategy: EntryAllocationStrategy;
    private entryType: EntryClass | null = null;
    private accountId: AccountId | null = null;
    private entryId: EntryId | null = null;
    private time: Date | null = null;

    private constructor(strategy: EntryAllocationStrategy, accountIdOrEntryId: AccountId | EntryId) {
        this.strategy = strategy;
        if (accountIdOrEntryId instanceof AccountId) {
            this.accountId = accountIdOrEntryId;
        } else {
            this.entryId = accountIdOrEntryId;
        }
    }

    static fifo(accountId: AccountId): EntryAllocationFilterBuilder {
        return new EntryAllocationFilterBuilder(EntryAllocationStrategy.FIFO, accountId);
    }

    static lifo(accountId: AccountId): EntryAllocationFilterBuilder {
        return new EntryAllocationFilterBuilder(EntryAllocationStrategy.LIFO, accountId);
    }

    static manual(entryId: EntryId): EntryAllocationFilterBuilder {
        return new EntryAllocationFilterBuilder(EntryAllocationStrategy.MANUAL, entryId);
    }

    withTypeOf(entryType: EntryClass): EntryAllocationFilterBuilder {
        this.entryType = entryType;
        return this;
    }

    withValidityContaining(time: Date): EntryAllocationFilterBuilder {
        this.time = time;
        return this;
    }

    build(): EntryAllocationFilter {
        return new EntryAllocationFilter(this.buildEntryPredicate(), this.buildComparator());
    }

    private buildEntryPredicate(): (entry: Entry) => boolean {
        const predicates: ((entry: Entry) => boolean)[] = [];

        if (this.entryType != null) {
            const type = this.entryType;
            predicates.push(entry => entry.entryKind === type);
        }

        if (this.entryId != null) {
            const eid = this.entryId;
            predicates.push(entry => entry.id().equals(eid));
        }

        if (this.accountId != null) {
            const aid = this.accountId;
            predicates.push(entry => entry.accountId().uuid === aid.uuid);
        }

        if (this.time != null) {
            const t = this.time;
            predicates.push(entry => entry.validity().isValidAt(t));
        }

        return (entry: Entry) => predicates.every(p => p(entry));
    }

    private buildComparator(): ((a: Entry, b: Entry) => number) | null {
        switch (this.strategy) {
            case EntryAllocationStrategy.FIFO:
                return (a, b) => a.appliesAt().getTime() - b.appliesAt().getTime();
            case EntryAllocationStrategy.LIFO:
                return (a, b) => b.appliesAt().getTime() - a.appliesAt().getTime();
            case EntryAllocationStrategy.MANUAL:
                return null;
        }
    }
}
