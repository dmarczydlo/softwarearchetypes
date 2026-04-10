import { Money } from '@softwarearchetypes/quantity';
import { AccountId } from './account-id.js';
import { EntryId } from './entry-id.js';
import { MetaData } from './metadata.js';
import { TransactionId } from './transaction-id.js';
import { Validity } from './validity.js';

export interface Entry {
    id(): EntryId;
    transactionId(): TransactionId;
    occurredAt(): Date;
    appliesAt(): Date;
    accountId(): AccountId;
    amount(): Money;
    metadata(): MetaData;
    validity(): Validity;
    appliedTo(): EntryId | null;
    readonly entryKind: 'credited' | 'debited';
}

export class AccountCredited implements Entry {
    readonly entryKind = 'credited' as const;
    private readonly _id: EntryId;
    private readonly _transactionId: TransactionId;
    private readonly _accountId: AccountId;
    private readonly _amount: Money;
    private readonly _appliesAt: Date;
    private readonly _occurredAt: Date;
    private readonly _metadata: MetaData;
    private readonly _validity: Validity;
    private readonly _appliedTo: EntryId | null;

    constructor(
        id: EntryId,
        transactionId: TransactionId,
        accountId: AccountId,
        amount: Money,
        appliesAt: Date,
        occurredAt: Date,
        metadata: MetaData,
        validity: Validity,
        appliedTo: EntryId | null
    ) {
        this._id = id;
        this._transactionId = transactionId;
        this._accountId = accountId;
        this._amount = amount;
        this._appliesAt = appliesAt;
        this._occurredAt = occurredAt;
        this._metadata = metadata;
        this._validity = validity;
        this._appliedTo = appliedTo;
    }

    static create(
        accountId: AccountId,
        transactionId: TransactionId,
        amount: Money,
        appliesAt: Date,
        occurredAt: Date,
        metadata: MetaData = MetaData.empty(),
        validity: Validity = Validity.always(),
        appliedTo: EntryId | null = null
    ): AccountCredited {
        return new AccountCredited(
            EntryId.generate(), transactionId, accountId, amount, appliesAt, occurredAt, metadata, validity, appliedTo
        );
    }

    id(): EntryId { return this._id; }
    transactionId(): TransactionId { return this._transactionId; }
    occurredAt(): Date { return this._occurredAt; }
    appliesAt(): Date { return this._appliesAt; }
    accountId(): AccountId { return this._accountId; }
    amount(): Money { return this._amount; }
    metadata(): MetaData { return this._metadata; }
    validity(): Validity { return this._validity; }
    appliedTo(): EntryId | null { return this._appliedTo; }
}

export class AccountDebited implements Entry {
    readonly entryKind = 'debited' as const;
    private readonly _id: EntryId;
    private readonly _transactionId: TransactionId;
    private readonly _accountId: AccountId;
    private readonly _amount: Money;
    private readonly _appliesAt: Date;
    private readonly _occurredAt: Date;
    private readonly _metadata: MetaData;
    private readonly _validity: Validity;
    private readonly _appliedTo: EntryId | null;

    constructor(
        id: EntryId,
        transactionId: TransactionId,
        accountId: AccountId,
        amount: Money,
        appliesAt: Date,
        occurredAt: Date,
        metadata: MetaData,
        validity: Validity,
        appliedTo: EntryId | null
    ) {
        this._id = id;
        this._transactionId = transactionId;
        this._accountId = accountId;
        this._amount = amount;
        this._appliesAt = appliesAt;
        this._occurredAt = occurredAt;
        this._metadata = metadata;
        this._validity = validity;
        this._appliedTo = appliedTo;
    }

    static create(
        accountId: AccountId,
        transactionId: TransactionId,
        amount: Money,
        appliesAt: Date,
        occurredAt: Date,
        metadata: MetaData = MetaData.empty(),
        validity: Validity = Validity.always(),
        appliedTo: EntryId | null = null
    ): AccountDebited {
        return new AccountDebited(
            EntryId.generate(), transactionId, accountId, amount, appliesAt, occurredAt, metadata, validity, appliedTo
        );
    }

    id(): EntryId { return this._id; }
    transactionId(): TransactionId { return this._transactionId; }
    occurredAt(): Date { return this._occurredAt; }
    appliesAt(): Date { return this._appliesAt; }
    accountId(): AccountId { return this._accountId; }
    // AccountDebited negates the amount
    amount(): Money { return this._amount.negate(); }
    metadata(): MetaData { return this._metadata; }
    validity(): Validity { return this._validity; }
    appliedTo(): EntryId | null { return this._appliedTo; }
}

export function isAccountCredited(entry: Entry): entry is AccountCredited {
    return entry.entryKind === 'credited';
}

export function isAccountDebited(entry: Entry): entry is AccountDebited {
    return entry.entryKind === 'debited';
}
