import { EventPublisher, InMemoryEventsPublisher } from '@softwarearchetypes/common';
import { AccountRepository, InMemoryAccountRepo } from './account-repository.js';
import { AccountingFacade } from './accounting-facade.js';
import { EntryAllocations } from './entry-allocations.js';
import { InMemoryEntryRepository, EntryRepository } from './entry-repository.js';
import { TransactionBuilderFactory } from './transaction-builder-factory.js';
import { TransactionRepository, InMemoryTransactionRepo } from './transaction-repository.js';

export class AccountingConfiguration {
    private readonly clock: () => Date;
    private readonly _accountRepository: AccountRepository;
    private readonly _transactionRepository: TransactionRepository;
    private readonly _transactionBuilderFactory: TransactionBuilderFactory;
    private readonly _eventPublisher: EventPublisher;
    private readonly _accountingFacade: AccountingFacade;

    constructor(
        clock: () => Date,
        accountRepository: AccountRepository,
        transactionRepository: TransactionRepository,
        transactionBuilderFactory: TransactionBuilderFactory,
        eventPublisher: EventPublisher,
        accountingFacade: AccountingFacade
    ) {
        this.clock = clock;
        this._accountRepository = accountRepository;
        this._transactionRepository = transactionRepository;
        this._transactionBuilderFactory = transactionBuilderFactory;
        this._eventPublisher = eventPublisher;
        this._accountingFacade = accountingFacade;
    }

    static inMemory(clock: () => Date): AccountingConfiguration {
        const entryRepository: EntryRepository = new InMemoryEntryRepository();
        const entryAllocations = new EntryAllocations(entryRepository);
        const accountRepository: AccountRepository = new InMemoryAccountRepo(entryRepository);
        const transactionRepository: TransactionRepository = new InMemoryTransactionRepo();
        const transactionBuilderFactory = new TransactionBuilderFactory(accountRepository, transactionRepository, entryAllocations, entryRepository, clock);
        const eventPublisher: EventPublisher = new InMemoryEventsPublisher();
        const accountingFacade = AccountingFacade.createWithQueries(clock, accountRepository, entryRepository, transactionRepository, transactionBuilderFactory, eventPublisher);
        return new AccountingConfiguration(clock, accountRepository, transactionRepository, transactionBuilderFactory, eventPublisher, accountingFacade);
    }

    facade(): AccountingFacade {
        return this._accountingFacade;
    }

    transactionBuilderFactory(): TransactionBuilderFactory {
        return this._transactionBuilderFactory;
    }

    accountRepository(): AccountRepository {
        return this._accountRepository;
    }

    eventPublisher(): EventPublisher {
        return this._eventPublisher;
    }
}
