import { AccountId } from '../account-id.js';
import { EntryType } from '../entry-view.js';
import { PostingContext } from './posting-context.js';

export interface EligibilityCondition {
    test(context: PostingContext): boolean;
    and(other: EligibilityCondition): EligibilityCondition;
    or(other: EligibilityCondition): EligibilityCondition;
    negate(): EligibilityCondition;
}

class BaseEligibilityCondition implements EligibilityCondition {
    private readonly _test: (context: PostingContext) => boolean;

    constructor(testFn: (context: PostingContext) => boolean) {
        this._test = testFn;
    }

    test(context: PostingContext): boolean {
        return this._test(context);
    }

    and(other: EligibilityCondition): EligibilityCondition {
        return new BaseEligibilityCondition(context => this.test(context) && other.test(context));
    }

    or(other: EligibilityCondition): EligibilityCondition {
        return new BaseEligibilityCondition(context => this.test(context) || other.test(context));
    }

    negate(): EligibilityCondition {
        return new BaseEligibilityCondition(context => !this.test(context));
    }
}

export const EligibilityConditions = {
    accountEquals(accountId: AccountId): EligibilityCondition {
        return new BaseEligibilityCondition(context =>
            context.triggeringEntries().some(entry => entry.accountId.uuid === accountId.uuid)
        );
    },

    entryTypeEquals(entryType: EntryType): EligibilityCondition {
        return new BaseEligibilityCondition(context =>
            context.triggeringEntries().some(it => it.type === entryType)
        );
    },

    accountType(type: string): EligibilityCondition {
        return new BaseEligibilityCondition(context =>
            context.triggeringEntries().some(entry => {
                const account = context.accountingFacade().findAccount(entry.accountId);
                return account != null && account.type === type;
            })
        );
    },

    custom(predicate: (context: PostingContext) => boolean): EligibilityCondition {
        return new BaseEligibilityCondition(predicate);
    }
};
