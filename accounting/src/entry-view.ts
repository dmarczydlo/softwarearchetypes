import { Money } from '@softwarearchetypes/quantity';
import { AccountId } from './account-id.js';
import { Entry, isAccountCredited } from './entry.js';
import { EntryId } from './entry-id.js';
import { TransactionId } from './transaction-id.js';

export enum EntryType {
    CREDIT = "CREDIT",
    DEBIT = "DEBIT"
}

export function entryTypeFrom(entry: Entry): EntryType {
    return isAccountCredited(entry) ? EntryType.CREDIT : EntryType.DEBIT;
}

export class EntryView {
    readonly entryId: EntryId;
    readonly type: EntryType;
    readonly amount: Money;
    readonly transactionId: TransactionId;
    readonly accountId: AccountId;
    readonly occurredAt: Date;
    readonly appliesAt: Date;

    constructor(
        entryId: EntryId,
        type: EntryType,
        amount: Money,
        transactionId: TransactionId,
        accountId: AccountId,
        occurredAt: Date,
        appliesAt: Date
    ) {
        this.entryId = entryId;
        this.type = type;
        this.amount = amount;
        this.transactionId = transactionId;
        this.accountId = accountId;
        this.occurredAt = occurredAt;
        this.appliesAt = appliesAt;
    }

    static from(entry: Entry): EntryView {
        return new EntryView(
            entry.id(),
            entryTypeFrom(entry),
            entry.amount(),
            entry.transactionId(),
            entry.accountId(),
            entry.occurredAt(),
            entry.appliesAt()
        );
    }
}
