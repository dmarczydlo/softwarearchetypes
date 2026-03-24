import { Money } from '@softwarearchetypes/quantity';
import { AccountingEvent } from './accounting-event.js';

export class DebitEntryRegistered implements AccountingEvent {
    private readonly _id: string;
    private readonly _occurredAt: Date;
    private readonly _appliesAt: Date;
    private readonly _entryId: string;
    private readonly _accountId: string;
    private readonly _transactionId: string;
    readonly amount: Money;

    static readonly TYPE = "DebitEntryRegistered";

    constructor(
        id: string,
        occurredAt: Date,
        appliesAt: Date,
        entryId: string,
        accountId: string,
        transactionId: string,
        amount: Money
    ) {
        this._id = id;
        this._occurredAt = occurredAt;
        this._appliesAt = appliesAt;
        this._entryId = entryId;
        this._accountId = accountId;
        this._transactionId = transactionId;
        this.amount = amount;
    }

    id(): string { return this._id; }
    type(): string { return DebitEntryRegistered.TYPE; }
    occurredAt(): Date { return this._occurredAt; }
    appliesAtDate(): Date { return this._appliesAt; }
    entryId(): string { return this._entryId; }
    accountId(): string { return this._accountId; }
    transactionId(): string { return this._transactionId; }
}
