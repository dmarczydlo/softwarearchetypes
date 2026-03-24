import { AccountMetadataView } from './account-metadata-view.js';
import { EntryView } from './entry-view.js';

export class TransactionAccountEntriesView {
    readonly account: AccountMetadataView;
    readonly entries: EntryView[];

    constructor(account: AccountMetadataView, entries: EntryView[]) {
        this.account = account;
        this.entries = entries;
    }
}
