import { Money } from '@softwarearchetypes/quantity';
import { AccountId } from './account-id.js';

export class Balances {
    readonly balances: Map<AccountId, Money>;

    constructor(balances: Map<AccountId, Money>) {
        this.balances = balances;
    }

    static empty(): Balances {
        return new Balances(new Map());
    }

    get(accountId: AccountId): Money | null {
        return this.balances.get(accountId) ?? null;
    }

    sum(): Money {
        let result = Money.zeroPln();
        for (const value of this.balances.values()) {
            result = result.add(value);
        }
        return result;
    }

    size(): number {
        return this.balances.size;
    }

    accounts(): Set<AccountId> {
        return new Set(this.balances.keys());
    }
}
