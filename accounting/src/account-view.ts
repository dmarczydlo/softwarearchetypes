import { Money } from '@softwarearchetypes/quantity';
import { AccountId } from './account-id.js';
import { EntryView } from './entry-view.js';

export class AccountView {
    readonly id: AccountId;
    readonly name: string;
    readonly type: string | null;
    readonly balance: Money;
    readonly entries: EntryView[];

    constructor(id: AccountId, name: string, type: string | null, balance: Money, entries: EntryView[]) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.balance = balance;
        this.entries = entries;
    }

    balanceAsOf(time: Date): Money {
        return this.entries
            .filter(e => e.appliesAt.getTime() <= time.getTime())
            .map(e => e.amount)
            .reduce((acc, amount) => acc.add(amount), Money.zeroPln());
    }
}
