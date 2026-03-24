import { randomUUID } from 'crypto';
import { Preconditions, Version } from '@softwarearchetypes/common';
import { Money } from '@softwarearchetypes/quantity';
import { AccountId } from './account-id.js';
import { AccountName } from './account-name.js';
import { AccountType } from './account-type.js';
import { Entries } from './entries.js';
import { Entry, isAccountCredited, isAccountDebited } from './entry.js';
import { AccountingEvent } from './events/accounting-event.js';
import { CreditEntryRegistered } from './events/credit-entry-registered.js';
import { DebitEntryRegistered } from './events/debit-entry-registered.js';

export class Account {
    private readonly accountId: AccountId;
    private readonly _type: AccountType | null;
    private readonly _name: AccountName | null;
    private _balance: Money;
    private readonly _version: Version;
    private readonly newEntries: Entries;
    private readonly pendingEvents: AccountingEvent[] = [];

    constructor(
        accountId: AccountId,
        type: AccountType | null,
        name: AccountName | null,
        balance?: Money,
        version?: Version
    ) {
        Preconditions.checkArgument(accountId != null, "Account ID must be defined");
        this.accountId = accountId;
        this._type = type;
        this._name = name;
        this._version = version ?? Version.initial();
        this._balance = balance ?? Money.zeroPln();
        this.newEntries = Entries.empty();
    }

    addEntry(entry: Entry): void {
        this.newEntries.add(entry);
        this._balance = this._balance.add(entry.amount());
        this.recordEntryEvent(entry);
    }

    addEntries(newEntries: Entry[]): void {
        this.newEntries.addAll(newEntries);
        newEntries.forEach(entry => {
            this._balance = this._balance.add(entry.amount());
            this.recordEntryEvent(entry);
        });
    }

    name(): string {
        return this._name?.value ?? "";
    }

    private recordEntryEvent(entry: Entry): void {
        let event: AccountingEvent;
        if (isAccountCredited(entry)) {
            event = new CreditEntryRegistered(
                randomUUID(),
                entry.occurredAt(),
                entry.appliesAt(),
                entry.id().value,
                entry.accountId().uuid,
                entry.transactionId().value,
                entry.amount()
            );
        } else {
            event = new DebitEntryRegistered(
                randomUUID(),
                entry.occurredAt(),
                entry.appliesAt(),
                entry.id().value,
                entry.accountId().uuid,
                entry.transactionId().value,
                entry.amount()
            );
        }
        this.pendingEvents.push(event);
    }

    getPendingEvents(): AccountingEvent[] {
        return [...this.pendingEvents];
    }

    clearPendingEvents(): void {
        this.pendingEvents.length = 0;
    }

    id(): AccountId {
        return this.accountId;
    }

    entries(): Entries {
        return this.newEntries.copy();
    }

    type(): AccountType | null {
        return this._type;
    }

    balance(): Money {
        return this._balance;
    }

    version(): Version {
        return this._version;
    }
}
