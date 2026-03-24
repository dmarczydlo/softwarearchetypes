import { Money } from '@softwarearchetypes/quantity';
import { Account } from './account.js';
import { AccountId } from './account-id.js';
import { Entry } from './entry.js';
import { Filter } from './filter.js';

export class EntryFilter {
    static HAVING_VALUES(key: string, value: string): (metadata: Map<string, string>) => boolean {
        return (metadata) => metadata.has(key) && metadata.get(key) === value;
    }

    static ENTRY_HAVING_METADATA(metadataPredicate: (metadata: Map<string, string>) => boolean): (entry: Entry) => boolean {
        return (entry) => metadataPredicate(entry.metadata().metadata);
    }

    static ENTRY_OF_ACCOUNT(accountIdOrPredicate: AccountId | ((accountId: AccountId) => boolean)): (entry: Entry) => boolean {
        if (accountIdOrPredicate instanceof AccountId) {
            return (entry) => entry.accountId().uuid === accountIdOrPredicate.uuid;
        }
        return (entry) => accountIdOrPredicate(entry.accountId());
    }

    static ENTRY_OF_AMOUNT(amountPredicate: (amount: Money) => boolean): (entry: Entry) => boolean {
        return (entry) => amountPredicate(entry.amount());
    }

    static ENTRY_OF_DATE(datePredicate: (date: Date) => boolean): (entry: Entry) => boolean {
        return (entry) => datePredicate(entry.occurredAt());
    }

    static ENTRY_OF_METADATA(metadataPredicate: (metadata: Map<string, string>) => boolean): (entry: Entry) => boolean {
        return (entry) => metadataPredicate(entry.metadata().metadata);
    }
}

export class AccountEntryFilter {
    private accountDescPredicate: (accountDesc: string) => boolean = () => true;
    private accountIdPredicate: (accountId: AccountId) => boolean = () => true;
    private occuredAtPredicate: (date: Date) => boolean = () => true;
    private amountPredicate: (amount: Money) => boolean = () => true;
    private metadataPredicate: (metaData: Map<string, string>) => boolean = () => true;

    private constructor() {}

    static filtering(): AccountEntryFilter {
        return new AccountEntryFilter();
    }

    onDateOlderThan(date: Date): AccountEntryFilter {
        const prev = this.occuredAtPredicate;
        this.occuredAtPredicate = (test) => prev(test) && test.getTime() <= date.getTime();
        return this;
    }

    onDateYoungerThan(date: Date): AccountEntryFilter {
        const prev = this.occuredAtPredicate;
        this.occuredAtPredicate = (test) => prev(test) && test.getTime() >= date.getTime();
        return this;
    }

    onDate(datePredicate: (date: Date) => boolean): AccountEntryFilter {
        const prev = this.occuredAtPredicate;
        this.occuredAtPredicate = (test) => prev(test) && datePredicate(test);
        return this;
    }

    onAccountsIn(idSet: Set<AccountId>): AccountEntryFilter {
        const prev = this.accountIdPredicate;
        const uuids = new Set<string>();
        for (const id of idSet) {
            uuids.add(id.uuid);
        }
        this.accountIdPredicate = (accountId) => prev(accountId) && uuids.has(accountId.uuid);
        return this;
    }

    havingMetadata(key: string, value: string): AccountEntryFilter {
        const prev = this.metadataPredicate;
        this.metadataPredicate = (metadata) => prev(metadata) && metadata.has(key) && metadata.get(key) === value;
        return this;
    }

    onAccountEquals(accountId: AccountId): AccountEntryFilter {
        return this.onAccountsIn(new Set([accountId]));
    }

    onAmount(amountPredicate: (amount: Money) => boolean): AccountEntryFilter {
        const prev = this.amountPredicate;
        this.amountPredicate = (amount) => prev(amount) && amountPredicate(amount);
        return this;
    }

    onAccountDescriptionContaining(desc: string): AccountEntryFilter {
        const prev = this.accountDescPredicate;
        this.accountDescPredicate = (accountDesc) => prev(accountDesc) && accountDesc.includes(desc);
        return this;
    }

    toFilter(): Filter {
        const accountIdPred = this.accountIdPredicate;
        const metadataPred = this.metadataPredicate;
        const datePred = this.occuredAtPredicate;
        const amountPred = this.amountPredicate;
        const accountDescPred = this.accountDescPredicate;

        const entryFilter = (entry: Entry) =>
            EntryFilter.ENTRY_OF_ACCOUNT(accountIdPred)(entry) &&
            EntryFilter.ENTRY_OF_METADATA(metadataPred)(entry) &&
            EntryFilter.ENTRY_OF_DATE(datePred)(entry) &&
            EntryFilter.ENTRY_OF_AMOUNT(amountPred)(entry);

        const accountFilter = (account: Account) => accountDescPred(account.name());

        return new Filter(entryFilter, accountFilter);
    }
}
