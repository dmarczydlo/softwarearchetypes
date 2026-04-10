import { Preconditions, CollectionTransformations } from '@softwarearchetypes/common';
import { Money } from '@softwarearchetypes/quantity';
import { Account } from './account.js';
import { AccountAmounts } from './account-amounts.js';
import { AccountId } from './account-id.js';
import { AccountRepository } from './account-repository.js';
import { EntryAllocations, EntryAllocationFilter, EntryAllocationFilterBuilder } from './entry-allocations.js';
import { EntryId } from './entry-id.js';
import { EntryRepository } from './entry-repository.js';
import { Entry, AccountCredited, AccountDebited, isAccountCredited, isAccountDebited } from './entry.js';
import { MetaData } from './metadata.js';
import { Transaction, TransactionEntriesConstraint, BALANCING_CONSTRAINT } from './transaction.js';
import { TransactionId } from './transaction-id.js';
import { TransactionRepository } from './transaction-repository.js';
import { TransactionType } from './transaction-type.js';
import { Validity } from './validity.js';

export class TransactionBuilder {
    private readonly accountRepository: AccountRepository;
    private readonly transactionRepository: TransactionRepository;
    private readonly entryAllocations: EntryAllocations;
    private readonly entryRepository: EntryRepository;
    private readonly clock: () => Date;
    private _transactionId: TransactionId = TransactionId.generate();
    private _occurredAt: Date | null = null;
    private _appliesAt: Date | null = null;
    private _type: TransactionType | null = null;
    private _metadata: MetaData = MetaData.empty();
    private _transactionEntriesConstraint: TransactionEntriesConstraint = BALANCING_CONSTRAINT;

    constructor(
        accountRepository: AccountRepository,
        transactionRepository: TransactionRepository,
        entryAllocations: EntryAllocations,
        entryRepository: EntryRepository,
        clock: () => Date
    ) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.entryAllocations = entryAllocations;
        this.entryRepository = entryRepository;
        this.clock = clock;
    }

    occurredAt(occurredAt: Date): TransactionBuilder {
        this._occurredAt = occurredAt;
        return this;
    }

    appliesAt(appliesAt: Date): TransactionBuilder {
        this._appliesAt = appliesAt;
        return this;
    }

    id(transactionId: TransactionId): TransactionBuilder {
        this._transactionId = transactionId;
        return this;
    }

    withMetadata(metadataOrKeyValues: MetaData | string[]): TransactionBuilder {
        if (metadataOrKeyValues instanceof MetaData) {
            this._metadata = metadataOrKeyValues;
        } else {
            this._metadata = new MetaData(CollectionTransformations.keyValueMapFrom(metadataOrKeyValues));
        }
        return this;
    }

    withTypeOf(type: string | TransactionType): TransactionBuilder {
        if (type instanceof TransactionType) {
            this._type = type;
        } else {
            this._type = TransactionType.of(type);
        }
        return this;
    }

    withTransactionEntriesConstraint(constraint: TransactionEntriesConstraint): TransactionBuilder {
        this._transactionEntriesConstraint = constraint;
        return this;
    }

    executing(): TransactionEntriesBuilder {
        return new TransactionEntriesBuilder(
            this.accountRepository, this.entryAllocations,
            this._transactionId, this._occurredAt!, this._appliesAt!, this._type!, this._metadata,
            this._transactionEntriesConstraint
        );
    }

    reverting(refTransactionOrId: Transaction | TransactionId): ReverseTransactionEntriesBuilder {
        let refTransaction: Transaction;
        if (refTransactionOrId instanceof TransactionId) {
            const found = this.transactionRepository.find(refTransactionOrId);
            if (found == null) {
                throw new Error(`Transaction ${refTransactionOrId.toString()} does not exist`);
            }
            refTransaction = found;
        } else {
            refTransaction = refTransactionOrId;
        }
        return new ReverseTransactionEntriesBuilder(
            this.accountRepository,
            refTransaction,
            this._transactionId, this._occurredAt!, this._appliesAt!, this._metadata,
            this._transactionEntriesConstraint
        );
    }

    compensatingExpired(entryIdOrEntry: EntryId | Entry): ExpirationCompensationTransactionEntriesBuilder {
        let entry: Entry;
        if (entryIdOrEntry instanceof EntryId) {
            const found = this.entryRepository.find(entryIdOrEntry);
            if (found == null) {
                throw new Error(`Entry ${entryIdOrEntry} does not exist`);
            }
            entry = found;
        } else {
            entry = entryIdOrEntry;
        }
        return new ExpirationCompensationTransactionEntriesBuilder(
            this.accountRepository, this.entryRepository,
            entry,
            this._transactionId, this._occurredAt!, this._appliesAt!, this._metadata,
            this._transactionEntriesConstraint, this.clock
        );
    }
}

export class TransactionEntriesBuilder {
    private readonly entries: Entry[] = [];
    private readonly involvedAccountsIds = new Set<AccountId>();
    private readonly accountRepository: AccountRepository;
    private readonly entryAllocations: EntryAllocations;
    private readonly transactionId: TransactionId;
    private readonly occurredAt: Date;
    private readonly appliesAt: Date;
    private readonly type: TransactionType;
    private readonly metadata: MetaData;
    private readonly transactionEntriesConstraint: TransactionEntriesConstraint;

    constructor(
        accountRepository: AccountRepository,
        entryAllocations: EntryAllocations,
        transactionId: TransactionId,
        occurredAt: Date,
        appliesAt: Date,
        type: TransactionType,
        metadata: MetaData,
        transactionEntriesConstraint: TransactionEntriesConstraint
    ) {
        this.accountRepository = accountRepository;
        this.entryAllocations = entryAllocations;
        this.transactionId = transactionId;
        this.occurredAt = occurredAt;
        this.appliesAt = appliesAt;
        this.type = type;
        this.metadata = metadata;
        this.transactionEntriesConstraint = transactionEntriesConstraint;
    }

    transfer(from: AccountId, to: AccountId, amount: Money): TransactionEntriesBuilder {
        return this.debitFrom(from, amount).creditTo(to, amount);
    }

    creditTo(accountIdOrMap: AccountId | Map<AccountId, Money>, amount?: Money, validityOrFilterOrEntryId?: Validity | EntryAllocationFilter | EntryId, filterOrEntryId?: EntryAllocationFilter | EntryId): TransactionEntriesBuilder {
        if (accountIdOrMap instanceof Map) {
            for (const [accountId, amt] of accountIdOrMap) {
                const entry = AccountCredited.create(accountId, this.transactionId, amt, this.appliesAt, this.occurredAt, this.metadata);
                this.entries.push(entry);
                this.involvedAccountsIds.add(accountId);
            }
            return this;
        }

        const accountId = accountIdOrMap;
        const amt = amount!;

        if (validityOrFilterOrEntryId === undefined) {
            // creditTo(accountId, amount)
            const entry = AccountCredited.create(accountId, this.transactionId, amt, this.appliesAt, this.occurredAt, this.metadata);
            this.entries.push(entry);
            this.involvedAccountsIds.add(accountId);
            return this;
        }

        if (validityOrFilterOrEntryId instanceof Validity) {
            const validity = validityOrFilterOrEntryId;
            if (filterOrEntryId === undefined) {
                // creditTo(accountId, amount, validity)
                return this.creditToWithValidityAndFilter(accountId, amt, validity, EntryAllocationFilter.NONE);
            }
            if (filterOrEntryId instanceof EntryId) {
                // creditTo(accountId, amount, validity, entryId)
                return this.creditToWithValidityAndFilter(accountId, amt, validity, EntryAllocationFilterBuilder.manual(filterOrEntryId).build());
            }
            // creditTo(accountId, amount, validity, filter)
            return this.creditToWithValidityAndFilter(accountId, amt, validity, filterOrEntryId);
        }

        if (validityOrFilterOrEntryId instanceof EntryId) {
            // creditTo(accountId, amount, entryId)
            return this.creditToWithValidityAndFilter(accountId, amt, Validity.always(), EntryAllocationFilterBuilder.manual(validityOrFilterOrEntryId).build());
        }

        if (validityOrFilterOrEntryId instanceof EntryAllocationFilter) {
            // creditTo(accountId, amount, filter)
            return this.creditToWithValidityAndFilter(accountId, amt, Validity.always(), validityOrFilterOrEntryId);
        }

        return this;
    }

    private creditToWithValidityAndFilter(accountId: AccountId, amount: Money, validity: Validity, filter: EntryAllocationFilter): TransactionEntriesBuilder {
        let refEntryId: EntryId | null = null;
        if (!filter.isEmpty()) {
            refEntryId = this.findEntryAllocation(filter);
        }
        const entry = AccountCredited.create(accountId, this.transactionId, amount, this.appliesAt, this.occurredAt, this.metadata, validity, refEntryId);
        this.entries.push(entry);
        this.involvedAccountsIds.add(accountId);
        return this;
    }

    debitFrom(accountIdOrMapOrSupplier: AccountId | Map<AccountId, Money> | (() => Map<AccountId, Money>), amount?: Money, validityOrFilterOrEntryId?: Validity | EntryAllocationFilter | EntryId, filterOrEntryId?: EntryAllocationFilter | EntryId): TransactionEntriesBuilder {
        if (typeof accountIdOrMapOrSupplier === 'function') {
            return this.debitFrom(accountIdOrMapOrSupplier());
        }

        if (accountIdOrMapOrSupplier instanceof Map) {
            for (const [accountId, amt] of accountIdOrMapOrSupplier) {
                const entry = AccountDebited.create(accountId, this.transactionId, amt, this.appliesAt, this.occurredAt, this.metadata);
                this.entries.push(entry);
                this.involvedAccountsIds.add(accountId);
            }
            return this;
        }

        const accountId = accountIdOrMapOrSupplier;
        const amt = amount!;

        if (validityOrFilterOrEntryId === undefined) {
            // debitFrom(accountId, amount)
            return this.debitFromWithValidityAndFilter(accountId, amt, Validity.always(), EntryAllocationFilter.NONE);
        }

        if (validityOrFilterOrEntryId instanceof Validity) {
            const validity = validityOrFilterOrEntryId;
            if (filterOrEntryId === undefined) {
                // debitFrom(accountId, amount, validity)
                return this.debitFromWithValidityAndFilter(accountId, amt, validity, EntryAllocationFilter.NONE);
            }
            if (filterOrEntryId instanceof EntryId) {
                // debitFrom(accountId, amount, validity, entryId)
                return this.debitFromWithValidityAndFilter(accountId, amt, validity, EntryAllocationFilterBuilder.manual(filterOrEntryId).build());
            }
            // debitFrom(accountId, amount, validity, filter)
            return this.debitFromWithValidityAndFilter(accountId, amt, validity, filterOrEntryId);
        }

        if (validityOrFilterOrEntryId instanceof EntryId) {
            // debitFrom(accountId, amount, entryId)
            return this.debitFromWithValidityAndFilter(accountId, amt, Validity.always(), EntryAllocationFilterBuilder.manual(validityOrFilterOrEntryId).build());
        }

        if (validityOrFilterOrEntryId instanceof EntryAllocationFilter) {
            // debitFrom(accountId, amount, filter)
            return this.debitFromWithValidityAndFilter(accountId, amt, Validity.always(), validityOrFilterOrEntryId);
        }

        return this;
    }

    private debitFromWithValidityAndFilter(accountId: AccountId, amount: Money, validity: Validity, filter: EntryAllocationFilter): TransactionEntriesBuilder {
        let refEntryId: EntryId | null = null;
        if (!filter.isEmpty()) {
            refEntryId = this.findEntryAllocation(filter);
        }
        const entry = AccountDebited.create(accountId, this.transactionId, amount, this.appliesAt, this.occurredAt, this.metadata, validity, refEntryId);
        this.entries.push(entry);
        this.involvedAccountsIds.add(accountId);
        return this;
    }

    entriesFor(accountAmounts: AccountAmounts): TransactionEntriesBuilder {
        for (const [accountId, amount] of accountAmounts.all) {
            if (amount.isNegative()) {
                this.debitFrom(accountId, amount.abs());
            } else {
                this.creditTo(accountId, amount);
            }
        }
        return this;
    }

    build(): Transaction {
        const accountsInvolved = this.accountRepository.findSet(this.involvedAccountsIds);
        if (accountsInvolved.size === this.involvedAccountsIds.size) {
            const entriesWithAccounts = new Map<Entry, Account>();
            for (const entry of this.entries) {
                const account = this.findAccountByEntryAccountId(accountsInvolved, entry.accountId());
                entriesWithAccounts.set(entry, account!);
            }
            return new Transaction(this.transactionId, null, this.type, this.occurredAt, this.appliesAt, entriesWithAccounts, this.transactionEntriesConstraint);
        } else {
            const missingIds: string[] = [];
            for (const id of this.involvedAccountsIds) {
                if (!this.findAccountByEntryAccountId(accountsInvolved, id)) {
                    missingIds.push(id.uuid);
                }
            }
            throw new Error(`Accounts ${missingIds.join(",")} does not exist`);
        }
    }

    private findAccountByEntryAccountId(accounts: Map<AccountId, Account>, accountId: AccountId): Account | null {
        for (const [key, value] of accounts) {
            if (key.uuid === accountId.uuid) {
                return value;
            }
        }
        return null;
    }

    private findEntryAllocation(filter: EntryAllocationFilter): EntryId {
        const foundEntry = this.entryAllocations.findAllocationFor(filter);
        if (foundEntry == null) {
            throw new Error("No matching entry found for allocation");
        }
        this.validateValidityOf(foundEntry);
        return foundEntry.id();
    }

    private validateValidityOf(referencedEntry: Entry): void {
        if (!referencedEntry.validity().isValidAt(this.appliesAt)) {
            throw new Error(`Referenced entry ${referencedEntry.id().toString()} is not valid at ${this.appliesAt.toISOString()}`);
        }
    }
}

export class ReverseTransactionEntriesBuilder {
    private readonly refTransaction: Transaction;
    private readonly entries: Entry[] = [];
    private readonly involvedAccountsIds = new Set<AccountId>();
    private readonly accountRepository: AccountRepository;
    private readonly transactionId: TransactionId;
    private readonly occurredAt: Date;
    private readonly appliesAt: Date;
    private readonly metadata: MetaData;
    private readonly transactionEntriesConstraint: TransactionEntriesConstraint;

    constructor(
        accountRepository: AccountRepository,
        refTransaction: Transaction,
        transactionId: TransactionId,
        occurredAt: Date,
        appliesAt: Date,
        metadata: MetaData,
        transactionEntriesConstraint: TransactionEntriesConstraint
    ) {
        this.accountRepository = accountRepository;
        this.refTransaction = refTransaction;
        this.transactionId = transactionId;
        this.occurredAt = occurredAt;
        this.appliesAt = appliesAt;
        this.metadata = metadata;
        this.transactionEntriesConstraint = transactionEntriesConstraint;

        for (const [, entryList] of refTransaction.entries()) {
            for (const entry of entryList) {
                this.revert(entry);
            }
        }
    }

    build(): Transaction {
        const accountsInvolved = this.accountRepository.findSet(this.involvedAccountsIds);
        if (accountsInvolved.size === this.involvedAccountsIds.size) {
            const entriesWithAccounts = new Map<Entry, Account>();
            for (const entry of this.entries) {
                const account = this.findAccountByEntryAccountId(accountsInvolved, entry.accountId());
                entriesWithAccounts.set(entry, account!);
            }
            return new Transaction(this.transactionId, this.refTransaction.id(), TransactionType.REVERSAL, this.occurredAt, this.appliesAt, entriesWithAccounts, this.transactionEntriesConstraint);
        } else {
            const missingIds: string[] = [];
            for (const id of this.involvedAccountsIds) {
                if (!this.findAccountByEntryAccountId(accountsInvolved, id)) {
                    missingIds.push(id.uuid);
                }
            }
            throw new Error(`Accounts ${missingIds.join(",")} does not exist`);
        }
    }

    private revert(entry: Entry): void {
        let reverted: Entry;
        if (isAccountCredited(entry)) {
            reverted = AccountDebited.create(entry.accountId(), this.transactionId, entry.amount(), this.appliesAt, this.occurredAt, MetaData.empty(), Validity.always(), entry.id());
        } else {
            // AccountDebited - amount() is already negated, negate again to get the positive value for credit
            reverted = AccountCredited.create(entry.accountId(), this.transactionId, entry.amount().negate(), this.appliesAt, this.occurredAt, MetaData.empty(), Validity.always(), entry.id());
        }
        this.entries.push(reverted);
        this.involvedAccountsIds.add(entry.accountId());
    }

    private findAccountByEntryAccountId(accounts: Map<AccountId, Account>, accountId: AccountId): Account | null {
        for (const [key, value] of accounts) {
            if (key.uuid === accountId.uuid) {
                return value;
            }
        }
        return null;
    }
}

export class ExpirationCompensationTransactionEntriesBuilder {
    private readonly refEntry: Entry;
    private readonly account: Account;
    private readonly entriesMap = new Map<Entry, Account>();
    private compensationAccount: Account | null = null;
    private readonly accountRepository: AccountRepository;
    private readonly entryRepository: EntryRepository;
    private readonly transactionId: TransactionId;
    private readonly occurredAt: Date;
    private readonly appliesAt: Date;
    private readonly metadata: MetaData;
    private readonly transactionEntriesConstraint: TransactionEntriesConstraint;

    constructor(
        accountRepository: AccountRepository,
        entryRepository: EntryRepository,
        refEntry: Entry,
        transactionId: TransactionId,
        occurredAt: Date,
        appliesAt: Date,
        metadata: MetaData,
        transactionEntriesConstraint: TransactionEntriesConstraint,
        clock: () => Date
    ) {
        Preconditions.checkArgument(refEntry.validity().hasExpired(clock()), `Entry ${refEntry.id()} has not expired yet`);
        this.refEntry = refEntry;
        this.accountRepository = accountRepository;
        this.entryRepository = entryRepository;
        this.transactionId = transactionId;
        this.occurredAt = occurredAt;
        this.appliesAt = appliesAt;
        this.metadata = metadata;
        this.transactionEntriesConstraint = transactionEntriesConstraint;

        const foundAccount = accountRepository.find(refEntry.accountId());
        if (foundAccount == null) {
            throw new Error(`Account ${refEntry.accountId()} does not exist`);
        }
        this.account = foundAccount;
    }

    withCompensationAccount(accountId: AccountId): ExpirationCompensationTransactionEntriesBuilder {
        const found = this.accountRepository.find(accountId);
        if (found == null) {
            throw new Error(`Compensation account ${this.refEntry.accountId()} does not exist`);
        }
        this.compensationAccount = found;
        return this;
    }

    build(): Transaction | null {
        const remainingAmount = this.calculateRemainingAmount();
        if (remainingAmount.isZero()) {
            return null;
        }

        if (isAccountCredited(this.refEntry)) {
            this.entriesMap.set(
                AccountDebited.create(this.refEntry.accountId(), this.transactionId, remainingAmount.abs(), this.appliesAt, this.occurredAt, this.metadata, Validity.always(), this.refEntry.id()),
                this.account
            );
            if (this.compensationAccount != null) {
                this.entriesMap.set(
                    AccountCredited.create(this.compensationAccount.id(), this.transactionId, remainingAmount.abs(), this.appliesAt, this.occurredAt, this.metadata, Validity.always(), this.refEntry.id()),
                    this.compensationAccount
                );
            }
        } else {
            this.entriesMap.set(
                AccountCredited.create(this.refEntry.accountId(), this.transactionId, remainingAmount.abs(), this.appliesAt, this.occurredAt, this.metadata, Validity.always(), this.refEntry.id()),
                this.account
            );
            if (this.compensationAccount != null) {
                this.entriesMap.set(
                    AccountDebited.create(this.compensationAccount.id(), this.transactionId, remainingAmount.abs(), this.appliesAt, this.occurredAt, this.metadata, Validity.always(), this.refEntry.id()),
                    this.compensationAccount
                );
            }
        }

        return new Transaction(this.transactionId, null, TransactionType.EXPIRATION_COMPENSATION, this.occurredAt, this.appliesAt, this.entriesMap, this.transactionEntriesConstraint);
    }

    private calculateRemainingAmount(): Money {
        const referencingEntries = this.entryRepository.findEntriesReferencing(this.refEntry);
        let referencingEntriesTotalAmount = Money.zeroPln();
        for (const e of referencingEntries) {
            referencingEntriesTotalAmount = referencingEntriesTotalAmount.add(e.amount());
        }
        return this.refEntry.amount().add(referencingEntriesTotalAmount);
    }
}
