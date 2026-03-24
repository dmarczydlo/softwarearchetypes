import { Money } from '@softwarearchetypes/quantity';

export enum ExecuteTransactionEntryType {
    CREDIT = "CREDIT",
    DEBIT = "DEBIT"
}

export class ExecuteTransactionEntry {
    readonly entryType: ExecuteTransactionEntryType;
    readonly accountId: string;
    readonly amount: Money;
    readonly validFrom: Date | null;
    readonly validTo: Date | null;
    readonly appliedToEntryId: string | null;

    constructor(
        entryType: ExecuteTransactionEntryType,
        accountId: string,
        amount: Money,
        validFrom: Date | null,
        validTo: Date | null,
        appliedToEntryId: string | null
    ) {
        this.entryType = entryType;
        this.accountId = accountId;
        this.amount = amount;
        this.validFrom = validFrom;
        this.validTo = validTo;
        this.appliedToEntryId = appliedToEntryId;
    }

    static credit(accountId: string, amount: Money): ExecuteTransactionEntry {
        return new ExecuteTransactionEntry(ExecuteTransactionEntryType.CREDIT, accountId, amount, null, null, null);
    }

    static debit(accountId: string, amount: Money): ExecuteTransactionEntry {
        return new ExecuteTransactionEntry(ExecuteTransactionEntryType.DEBIT, accountId, amount, null, null, null);
    }
}

export class ExecuteTransactionCommand {
    readonly occurredAt: Date;
    readonly appliesAt: Date;
    readonly transactionType: string;
    readonly metadata: Map<string, string> | null;
    readonly entries: ExecuteTransactionEntry[];

    constructor(
        occurredAt: Date,
        appliesAt: Date,
        transactionType: string,
        metadata: Map<string, string> | null,
        entries: ExecuteTransactionEntry[]
    ) {
        this.occurredAt = occurredAt;
        this.appliesAt = appliesAt;
        this.transactionType = transactionType;
        this.metadata = metadata;
        this.entries = entries;
    }
}
