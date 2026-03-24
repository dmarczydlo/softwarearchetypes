import { ResultFactory, Result, CompositeSetResult, EventPublisher } from '@softwarearchetypes/common';
import { Money } from '@softwarearchetypes/quantity';
import { Account } from './account.js';
import { AccountAmounts } from './account-amounts.js';
import { AccountEntryFilter } from './account-entry-filter.js';
import { AccountId } from './account-id.js';
import { AccountMetadataView } from './account-metadata-view.js';
import { AccountName } from './account-name.js';
import { AccountRepository } from './account-repository.js';
import { AccountType } from './account-type.js';
import { AccountView } from './account-view.js';
import { Balances } from './balances.js';
import { CreateAccount } from './create-account.js';
import { EntryRepository } from './entry-repository.js';
import { EntryView } from './entry-view.js';
import { Entry } from './entry.js';
import { ExecuteTransactionCommand, ExecuteTransactionEntryType } from './execute-transaction-command.js';
import { AccountingEvent } from './events/accounting-event.js';
import { Filter } from './filter.js';
import { MetaData } from './metadata.js';
import { ProjectionAccount } from './projection-account.js';
import { ReverseTransactionCommand } from './reverse-transaction-command.js';
import { TransactionBuilder } from './transaction-builder.js';
import { TransactionBuilderFactory } from './transaction-builder-factory.js';
import { TransactionAccountEntriesView } from './transaction-account-entries-view.js';
import { TransactionId } from './transaction-id.js';
import { TransactionRepository } from './transaction-repository.js';
import { Transaction } from './transaction.js';
import { TransactionType } from './transaction-type.js';
import { TransactionView } from './transaction-view.js';
import { Validity } from './validity.js';

class AccountViewQueries {
    private readonly accountRepository: AccountRepository;
    private readonly entryRepository: EntryRepository;

    constructor(accountRepository: AccountRepository, entryRepository: EntryRepository) {
        this.accountRepository = accountRepository;
        this.entryRepository = entryRepository;
    }

    find(accountId: AccountId): AccountView | null {
        const projection = this.accountRepository.findProjectionAccount(accountId);
        if (projection != null) {
            return this.projectionAccountViewFrom(accountId, projection);
        }
        const account = this.accountRepository.find(accountId);
        if (account != null) {
            return this.accountViewFrom(account);
        }
        return null;
    }

    findSet(accountIds: Set<AccountId>): Map<AccountId, AccountView> {
        const result = new Map<AccountId, AccountView>();
        for (const id of accountIds) {
            const view = this.find(id);
            if (view != null) {
                result.set(id, view);
            }
        }
        return result;
    }

    findAll(): AccountView[] {
        const result: AccountView[] = [];
        result.push(...this.accountRepository.findAll().map(a => this.accountViewFrom(a)));
        result.push(...this.accountRepository.findAllProjectionAccounts().map(p => this.projectionAccountViewFrom(p.id(), p)));
        return result;
    }

    private accountViewFrom(acc: Account): AccountView {
        const entries = this.entryRepository.findAllFor(acc.id()).map(e => EntryView.from(e));
        const type = acc.type() != null ? acc.type()!.toString() : null;
        return new AccountView(acc.id(), acc.name(), type, acc.balance(), entries);
    }

    private projectionAccountViewFrom(accountId: AccountId, projection: ProjectionAccount): AccountView {
        const filteredEntries = this.entryRepository
            .findAllMatching(projection.filter().entryFilter())
            .map(e => EntryView.from(e));
        let balance = Money.zeroPln();
        for (const e of filteredEntries) {
            balance = balance.add(e.amount);
        }
        return new AccountView(accountId, projection.desc(), null, balance, filteredEntries);
    }
}

export class AccountingFacade {
    private readonly clock: () => Date;
    private readonly accountRepository: AccountRepository;
    private readonly accountViewQueries: AccountViewQueries;
    private readonly transactionRepository: TransactionRepository;
    private readonly transactionBuilderFactory: TransactionBuilderFactory;
    private readonly eventPublisher: EventPublisher;

    constructor(
        clock: () => Date,
        accountRepository: AccountRepository,
        accountViewQueries: AccountViewQueries,
        transactionRepository: TransactionRepository,
        transactionBuilderFactory: TransactionBuilderFactory,
        eventPublisher: EventPublisher
    ) {
        this.clock = clock;
        this.accountRepository = accountRepository;
        this.accountViewQueries = accountViewQueries;
        this.transactionRepository = transactionRepository;
        this.transactionBuilderFactory = transactionBuilderFactory;
        this.eventPublisher = eventPublisher;
    }

    static createWithQueries(
        clock: () => Date,
        accountRepository: AccountRepository,
        entryRepository: EntryRepository,
        transactionRepository: TransactionRepository,
        transactionBuilderFactory: TransactionBuilderFactory,
        eventPublisher: EventPublisher
    ): AccountingFacade {
        const accountViewQueries = new AccountViewQueries(accountRepository, entryRepository);
        return new AccountingFacade(clock, accountRepository, accountViewQueries, transactionRepository, transactionBuilderFactory, eventPublisher);
    }

    createAccounts(requests: Set<CreateAccount>): Result<string, Set<AccountId>> {
        const ids = new Set<AccountId>();
        for (const req of requests) {
            ids.add(req.accountId);
        }
        const existing = this.accountRepository.findSet(ids);
        if (existing.size > 0) {
            return ResultFactory.failure(`Some accounts already exists: ${Array.from(ids).map(id => id.toString()).join(", ")}`);
        }
        for (const req of requests) {
            this.createAccountInternal(req.accountId, AccountType[req.type as keyof typeof AccountType], AccountName.of(req.name));
        }
        return ResultFactory.success(new Set<AccountId>());
    }

    createAccount(request: CreateAccount): Result<string, AccountId> {
        return this.createAccountInternal(request.accountId, AccountType[request.type as keyof typeof AccountType], AccountName.of(request.name));
    }

    private createAccountInternal(accountId: AccountId, type: AccountType, name: AccountName): Result<string, AccountId> {
        if (this.accountRepository.find(accountId) != null) {
            return ResultFactory.failure("Account with id " + accountId + " already exists");
        }
        const account = new Account(accountId, type, name);
        this.accountRepository.saveAccount(account);
        return ResultFactory.success(account.id());
    }

    balance(accountId: AccountId): Money | null {
        const view = this.accountViewQueries.find(accountId);
        return view != null ? view.balance : null;
    }

    balanceAsOf(accountId: AccountId, when: Date): Money | null {
        const view = this.accountViewQueries.find(accountId);
        return view != null ? view.balanceAsOf(when) : null;
    }

    balancesAsOf(accounts: Set<AccountId>, when: Date): Balances {
        const entriesByAccount = this.accountViewQueries.findSet(accounts);
        const balances = new Map<AccountId, Money>();
        for (const [accountId, view] of entriesByAccount) {
            balances.set(accountId, view.balanceAsOf(when));
        }
        return new Balances(balances);
    }

    balances(accounts: Set<AccountId>): Balances {
        return this.balancesAsOf(accounts, this.clock());
    }

    createAccountsWithInitialBalances(requests: Set<CreateAccount>, accountAmounts: AccountAmounts): Result<string, Set<AccountId>> {
        const creation = this.createAccounts(requests);
        const txResult = creation.flatMap(() => {
            const transaction = this.transactionBuilderFactory.transaction()
                .withTypeOf(TransactionType.INITIALIZATION)
                .occurredAt(this.clock())
                .appliesAt(this.clock())
                .executing()
                .entriesFor(accountAmounts)
                .build();
            return this.executeSingle(transaction);
        });
        if (txResult.isSuccess()) {
            return creation;
        } else {
            return ResultFactory.failure(txResult.getFailure());
        }
    }

    transaction(): TransactionBuilder {
        return this.transactionBuilderFactory.transaction();
    }

    handle(command: ExecuteTransactionCommand): Result<string, TransactionId> {
        try {
            const entriesBuilder = this.transactionBuilderFactory.transaction()
                .occurredAt(command.occurredAt)
                .appliesAt(command.appliesAt)
                .withTypeOf(command.transactionType)
                .withMetadata(MetaData.of(command.metadata))
                .executing();

            for (const entry of command.entries) {
                const validity = Validity.between(entry.validFrom, entry.validTo);
                const accountId = AccountId.of(entry.accountId);
                const amount = entry.amount;

                switch (entry.entryType) {
                    case ExecuteTransactionEntryType.CREDIT:
                        entriesBuilder.creditTo(accountId, amount, validity);
                        break;
                    case ExecuteTransactionEntryType.DEBIT:
                        entriesBuilder.debitFrom(accountId, amount, validity);
                        break;
                }
            }

            const transaction = entriesBuilder.build();
            return this.executeSingle(transaction);
        } catch (ex: unknown) {
            return ResultFactory.failure((ex as Error).message);
        }
    }

    handleReverse(command: ReverseTransactionCommand): Result<string, TransactionId> {
        try {
            const transaction = this.transactionBuilderFactory.transaction()
                .occurredAt(command.occurredAt)
                .appliesAt(command.appliesAt)
                .reverting(TransactionId.of(command.refTransactionId))
                .build();
            return this.executeSingle(transaction);
        } catch (ex: unknown) {
            return ResultFactory.failure((ex as Error).message);
        }
    }

    transfer(from: AccountId, to: AccountId, amount: Money, occurredAt: Date, appliesAt: Date, metaData?: MetaData): Result<string, TransactionId> {
        const md = metaData ?? MetaData.empty();
        try {
            const transaction = this.transactionBuilderFactory.transaction()
                .occurredAt(occurredAt)
                .appliesAt(appliesAt)
                .withTypeOf("transfer")
                .withMetadata(md)
                .executing()
                .debitFrom(from, amount)
                .creditTo(to, amount)
                .build();
            transaction.execute();
            this.transactionRepository.save(transaction);
            this.saveAccountsAndPublishEvents(transaction.accountsInvolved());
            return ResultFactory.success(transaction.id());
        } catch (ex: unknown) {
            return ResultFactory.failure((ex as Error).message);
        }
    }

    executeMultiple(...transactions: Transaction[]): Result<string, Set<TransactionId>> {
        const result = CompositeSetResult.fromSet<string, TransactionId>(new Set());
        for (const transaction of transactions) {
            const accumulated = result.accumulate(this.executeSingle(transaction));
            if (accumulated.isFailure()) {
                return accumulated.toResult();
            }
        }
        return result.toResult();
    }

    executeSingle(transaction: Transaction): Result<string, TransactionId> {
        try {
            transaction.execute();
            this.transactionRepository.save(transaction);
            this.saveAccountsAndPublishEvents(transaction.accountsInvolved());
        } catch (ex: unknown) {
            return ResultFactory.failure((ex as Error).message);
        }
        return ResultFactory.success(transaction.id());
    }

    // Overloaded execute: single or multiple transactions
    execute(...transactions: Transaction[]): Result<string, TransactionId> | Result<string, Set<TransactionId>> {
        if (transactions.length === 1) {
            return this.executeSingle(transactions[0]);
        }
        return this.executeMultiple(...transactions);
    }

    createProjectingAccountWithFilter(projecting: AccountId, filter: Filter, name: string): Result<string, AccountId> {
        this.accountRepository.saveProjectionAccount(new ProjectionAccount(projecting, filter, name));
        return ResultFactory.success(projecting);
    }

    createProjectingAccount(projecting: AccountId, accountEntryFilter: AccountEntryFilter, description: string): Result<string, AccountId> {
        return this.createProjectingAccountWithFilter(projecting, accountEntryFilter.toFilter(), description);
    }

    findAccount(accountId: AccountId): AccountView | null {
        return this.accountViewQueries.find(accountId);
    }

    findAccounts(accountIds: Set<AccountId>): AccountView[] {
        return Array.from(this.accountViewQueries.findSet(accountIds).values());
    }

    findAll(): AccountView[] {
        return this.accountViewQueries.findAll();
    }

    findTransactionBy(transactionId: TransactionId): TransactionView | null {
        const transaction = this.transactionRepository.find(transactionId);
        if (transaction == null) return null;
        return new TransactionView(
            transaction.id(),
            transaction.refId(),
            transaction.type(),
            transaction.occurredAt(),
            transaction.appliesAt(),
            this.entriesViewsFrom(transaction)
        );
    }

    findTransactionIdsFor(accountId: AccountId): TransactionId[] {
        const account = this.accountRepository.find(accountId);
        if (account == null) return [];
        return account.entries().stream().map(e => e.transactionId());
    }

    private entriesViewsFrom(transaction: Transaction): TransactionAccountEntriesView[] {
        const result: TransactionAccountEntriesView[] = [];
        for (const [account, entryList] of transaction.entries()) {
            const accountView = new AccountMetadataView(account.id(), account.name(), account.type() != null ? account.type()!.toString() : null);
            const entries = entryList.map(e => EntryView.from(e));
            result.push(new TransactionAccountEntriesView(accountView, entries));
        }
        return result;
    }

    private saveAccountsAndPublishEvents(accounts: Account[]): void {
        const allEvents: AccountingEvent[] = [];
        for (const account of accounts) {
            allEvents.push(...account.getPendingEvents());
            account.clearPendingEvents();
        }
        this.accountRepository.saveAccounts(accounts);
        this.eventPublisher.publishAll(allEvents);
    }
}
