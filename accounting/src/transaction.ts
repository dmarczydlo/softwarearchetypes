import { Preconditions } from '@softwarearchetypes/common';
import { Money } from '@softwarearchetypes/quantity';
import { Account } from './account.js';
import { isDoubleEntryBookingEnabled } from './account-type.js';
import { Entry } from './entry.js';
import { TransactionId } from './transaction-id.js';
import { TransactionType } from './transaction-type.js';

export interface TransactionEntriesConstraint {
    test(entries: Map<Entry, Account>): boolean;
    errorMessage(): string;
}

export const BALANCING_CONSTRAINT: TransactionEntriesConstraint = {
    errorMessage(): string {
        return "Entry balance within transaction must always be 0";
    },
    test(entries: Map<Entry, Account>): boolean {
        const entryMap = entries ?? new Map<Entry, Account>();
        let balance = Money.zeroPln();
        for (const [entry, account] of entryMap) {
            if (account.type() != null && isDoubleEntryBookingEnabled(account.type()!)) {
                balance = balance.add(entry.amount());
            }
        }
        return balance.isZero();
    }
};

export const MIN_2_ENTRIES_CONSTRAINT: TransactionEntriesConstraint = {
    errorMessage(): string {
        return "Transaction must have at least 2 entries";
    },
    test(entries: Map<Entry, Account>): boolean {
        return (entries?.size ?? 0) >= 2;
    }
};

export const MIN_2_ACCOUNTS_INVOLVED_CONSTRAINT: TransactionEntriesConstraint = {
    errorMessage(): string {
        return "Transaction must involve at least 2 accounts";
    },
    test(entries: Map<Entry, Account>): boolean {
        const accountIds = new Set<string>();
        for (const account of (entries ?? new Map<Entry, Account>()).values()) {
            accountIds.add(account.id().uuid);
        }
        return accountIds.size >= 2;
    }
};

export class Transaction {
    private readonly _id: TransactionId;
    private readonly _refId: TransactionId | null;
    private readonly _type: TransactionType;
    private readonly _occurredAt: Date;
    private readonly _appliesAt: Date;
    private readonly _entries: Map<Account, Entry[]>;

    constructor(
        id: TransactionId,
        refId: TransactionId | null,
        type: TransactionType,
        occurredAt: Date,
        appliesAt: Date,
        entries: Map<Entry, Account>,
        transactionEntriesConstraint: TransactionEntriesConstraint
    ) {
        Preconditions.checkArgument(id != null, "Transaction must have its ID");
        Preconditions.checkArgument(type != null, "Transaction must have its type");
        Preconditions.checkArgument(occurredAt != null, "Transaction must have its occurrence time");
        Preconditions.checkArgument(appliesAt != null, "Transaction must have its application time");
        Preconditions.checkArgument(transactionEntriesConstraint.test(entries), transactionEntriesConstraint.errorMessage());

        this._id = id;
        this._refId = refId;
        this._type = type;
        this._occurredAt = occurredAt;
        this._appliesAt = appliesAt;

        // Group entries by account
        this._entries = new Map<Account, Entry[]>();
        for (const [entry, account] of entries) {
            const existing = this._entries.get(account) ?? [];
            existing.push(entry);
            this._entries.set(account, existing);
        }
    }

    id(): TransactionId {
        return this._id;
    }

    refId(): TransactionId | null {
        return this._refId;
    }

    accountsInvolved(): Account[] {
        return Array.from(this._entries.keys());
    }

    entries(): Map<Account, Entry[]> {
        return new Map(this._entries);
    }

    occurredAt(): Date {
        return this._occurredAt;
    }

    appliesAt(): Date {
        return this._appliesAt;
    }

    type(): TransactionType {
        return this._type;
    }

    execute(): void {
        for (const [account, entries] of this._entries) {
            account.addEntries(entries);
        }
    }
}
