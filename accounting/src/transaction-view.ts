import { TransactionAccountEntriesView } from './transaction-account-entries-view.js';
import { TransactionId } from './transaction-id.js';
import { TransactionType } from './transaction-type.js';

export class TransactionView {
    readonly id: TransactionId;
    readonly refId: TransactionId | null;
    readonly type: TransactionType;
    readonly occurredAt: Date;
    readonly appliesAt: Date;
    readonly entries: TransactionAccountEntriesView[];

    constructor(
        id: TransactionId,
        refId: TransactionId | null,
        type: TransactionType,
        occurredAt: Date,
        appliesAt: Date,
        entries: TransactionAccountEntriesView[]
    ) {
        this.id = id;
        this.refId = refId;
        this.type = type;
        this.occurredAt = occurredAt;
        this.appliesAt = appliesAt;
        this.entries = entries;
    }
}
