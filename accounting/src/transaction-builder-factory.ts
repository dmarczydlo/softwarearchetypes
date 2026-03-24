import { AccountRepository } from './account-repository.js';
import { EntryAllocations } from './entry-allocations.js';
import { EntryRepository } from './entry-repository.js';
import { TransactionBuilder } from './transaction-builder.js';
import { TransactionRepository } from './transaction-repository.js';

export class TransactionBuilderFactory {
    private readonly accountRepository: AccountRepository;
    private readonly transactionRepository: TransactionRepository;
    private readonly entryAllocations: EntryAllocations;
    private readonly entryRepository: EntryRepository;
    private readonly clock: () => Date;

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

    transaction(): TransactionBuilder {
        return new TransactionBuilder(
            this.accountRepository, this.transactionRepository, this.entryAllocations, this.entryRepository, this.clock
        );
    }
}
