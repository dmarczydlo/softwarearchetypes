import { Entry } from './entry.js';
import { Account } from './account.js';

export class Filter {
    private readonly _entryFilter: (entry: Entry) => boolean;
    private readonly _accountFilter: (account: Account) => boolean;

    constructor(entryFilter: (entry: Entry) => boolean, accountFilter: (account: Account) => boolean) {
        this._entryFilter = entryFilter;
        this._accountFilter = accountFilter;
    }

    static just(entryFilter: (entry: Entry) => boolean): Filter {
        return new Filter(entryFilter, () => true);
    }

    entryFilter(): (entry: Entry) => boolean {
        return this._entryFilter;
    }

    accountFilter(): (account: Account) => boolean {
        return this._accountFilter;
    }
}
