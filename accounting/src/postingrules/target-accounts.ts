import { AccountView } from '../account-view.js';

export class TargetAccounts {
    readonly accounts: Map<string, AccountView>;

    constructor(accounts: Map<string, AccountView>) {
        this.accounts = new Map(accounts);
    }

    get(tag: string): AccountView | null {
        return this.accounts.get(tag) ?? null;
    }

    getRequired(tag: string): AccountView {
        const account = this.accounts.get(tag);
        if (account == null) {
            throw new Error(`Required account with tag '${tag}' not found`);
        }
        return account;
    }

    static of(accounts: Map<string, AccountView>): TargetAccounts {
        return new TargetAccounts(accounts);
    }
}
