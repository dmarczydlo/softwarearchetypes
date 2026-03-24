import { expect } from 'vitest';
import { Money } from '@softwarearchetypes/quantity';
import { AccountId } from './account-id.js';
import { EntryType, EntryView } from './entry-view.js';
import { TransactionId } from './transaction-id.js';
import { TransactionType } from './transaction-type.js';
import { TransactionView } from './transaction-view.js';
import { TransactionAccountEntriesView } from './transaction-account-entries-view.js';

export class TransactionViewAssert {
    private readonly actual: TransactionView;

    constructor(actual: TransactionView) {
        this.actual = actual;
    }

    static assertThat(actual: TransactionView): TransactionViewAssert {
        return new TransactionViewAssert(actual);
    }

    hasId(id: TransactionId): TransactionViewAssert {
        expect(this.actual.id.value).toBe(id.value);
        return this;
    }

    hasType(type: TransactionType): TransactionViewAssert {
        expect(this.actual.type.value).toBe(type.value);
        return this;
    }

    occurredAt(time: Date): TransactionViewAssert {
        expect(this.actual.occurredAt.getTime()).toBe(time.getTime());
        return this;
    }

    appliesAt(time: Date): TransactionViewAssert {
        expect(this.actual.appliesAt.getTime()).toBe(time.getTime());
        return this;
    }

    hasReferenceTo(transactionId: TransactionId): TransactionViewAssert {
        expect(this.actual.refId).not.toBeNull();
        expect(this.actual.refId!.value).toBe(transactionId.value);
        return this;
    }

    containsEntries(): TransactionEntriesViewAssert {
        return new TransactionEntriesViewAssert(this.actual.entries);
    }
}

export class TransactionEntriesViewAssert {
    private readonly actual: TransactionAccountEntriesView[];

    constructor(actual: TransactionAccountEntriesView[]) {
        this.actual = actual;
    }

    allOccurredAt(time: Date): TransactionEntriesViewAssert {
        const allEntries = this.allEntries();
        expect(allEntries.every(e => e.occurredAt.getTime() === time.getTime())).toBe(true);
        return this;
    }

    allHaveTransactionId(id: TransactionId): TransactionEntriesViewAssert {
        const allEntries = this.allEntries();
        expect(allEntries.every(e => e.transactionId.value === id.value)).toBe(true);
        return this;
    }

    containExactly(expectedCount: number): TransactionEntriesViewAssert {
        expect(this.allEntries().length).toBe(expectedCount);
        return this;
    }

    containExactlyOneEntry(accountId: AccountId, type: EntryType, amount: Money): TransactionEntriesViewAssert {
        const entries = this.entriesFor(accountId).filter(e => e.type === type && e.amount.equals(amount));
        expect(entries.length).toBe(1);
        return this;
    }

    containEntry(accountId: AccountId, type: EntryType, amount: Money): TransactionEntriesViewAssert {
        const found = this.entriesFor(accountId).some(e => e.type === type && e.amount.equals(amount));
        expect(found).toBe(true);
        return this;
    }

    private entriesFor(accountId: AccountId): EntryView[] {
        return this.actual
            .filter(e => e.account.id.uuid === accountId.uuid)
            .flatMap(e => e.entries);
    }

    private allEntries(): EntryView[] {
        return this.actual.flatMap(e => e.entries);
    }
}
