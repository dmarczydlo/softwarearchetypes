import { Transaction } from './transaction.js';
import { TransactionId } from './transaction-id.js';

export interface TransactionRepository {
    find(transactionId: TransactionId): Transaction | null;
    save(transaction: Transaction): void;
}

export class InMemoryTransactionRepo implements TransactionRepository {
    private readonly transactions = new Map<string, Transaction>();

    find(transactionId: TransactionId): Transaction | null {
        return this.transactions.get(transactionId.value) ?? null;
    }

    save(transaction: Transaction): void {
        this.transactions.set(transaction.id().value, transaction);
    }
}
