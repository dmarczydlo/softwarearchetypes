import { Money } from '@softwarearchetypes/quantity';
import { AccountId } from './account-id.js';

export class AccountAmounts {
    readonly all: Map<AccountId, Money>;

    constructor(all: Map<AccountId, Money>) {
        // Filter out null values
        this.all = new Map<AccountId, Money>();
        for (const [key, value] of all) {
            if (value != null) {
                this.all.set(key, value);
            }
        }
    }

    static of(amounts: Map<AccountId, Money>): AccountAmounts {
        return new AccountAmounts(amounts);
    }

    static empty(): AccountAmounts {
        return AccountAmounts.of(new Map());
    }

    add(accountId: AccountId, amount: Money): AccountAmounts {
        const newAmounts = new Map(this.all);
        newAmounts.set(accountId, amount);
        return new AccountAmounts(newAmounts);
    }

    subtract(toSubtract: AccountAmounts): AccountAmounts {
        const diff = new Map<AccountId, Money>();
        for (const [accountId, cappedAmount] of this.all) {
            const notCappedAmount = toSubtract.all.get(accountId) ?? Money.zeroPln();
            const difference = cappedAmount.subtract(notCappedAmount);
            if (difference.isNegative()) {
                diff.set(accountId, difference);
            }
        }
        return new AccountAmounts(diff);
    }

    addAmounts(toAdd: AccountAmounts): AccountAmounts {
        const result = new Map(this.all);
        for (const [accountId, amount] of toAdd.all) {
            const existing = result.get(accountId) ?? Money.zeroPln();
            result.set(accountId, existing.add(amount));
        }
        return new AccountAmounts(result);
    }

    sum(): Money {
        let result = Money.zeroPln();
        for (const value of this.all.values()) {
            result = result.add(value);
        }
        return result;
    }
}
