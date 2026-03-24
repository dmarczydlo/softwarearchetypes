import { Preconditions } from '@softwarearchetypes/common';
import { AccountId } from '../account-id.js';
import { EntryType } from '../entry-view.js';
import { AccountFinder, AccountFinderFactory } from './account-finder.js';
import { ConfigurablePostingRule } from './configurable-posting-rule.js';
import { EligibilityCondition, EligibilityConditions } from './eligibility-condition.js';
import { PostingCalculator } from './posting-calculator.js';
import { PostingRuleId } from './posting-rule-id.js';

export class PostingRuleBuilder {
    private readonly _id: PostingRuleId = PostingRuleId.generate();
    private readonly _name: string;
    private _eligibilityCondition: EligibilityCondition | null = null;
    private _accountFinder: AccountFinder | null = null;
    private _postingCalculator: PostingCalculator | null = null;
    private _priority: number = 100;

    private constructor(name: string) {
        this._name = name;
    }

    static createRule(name: string): PostingRuleBuilder {
        return new PostingRuleBuilder(name);
    }

    whenTriggerAccountIs(accountId: AccountId): PostingRuleBuilder {
        return this.when(EligibilityConditions.accountEquals(accountId));
    }

    whenTriggerEntryTypeIs(entryType: EntryType): PostingRuleBuilder {
        return this.when(EligibilityConditions.entryTypeEquals(entryType));
    }

    when(condition: EligibilityCondition): PostingRuleBuilder {
        this._eligibilityCondition = condition;
        return this;
    }

    transferTo(finderOrTagOrAccounts: AccountFinder | string | Map<string, AccountId>, accountId?: AccountId): PostingRuleBuilder {
        if (typeof finderOrTagOrAccounts === 'string') {
            this._accountFinder = AccountFinderFactory.fixed(finderOrTagOrAccounts, accountId!);
        } else if (finderOrTagOrAccounts instanceof Map) {
            this._accountFinder = AccountFinderFactory.fixed(finderOrTagOrAccounts);
        } else {
            this._accountFinder = finderOrTagOrAccounts;
        }
        return this;
    }

    calculateUsing(calculator: PostingCalculator): PostingRuleBuilder {
        this._postingCalculator = calculator;
        return this;
    }

    priority(priority: number): PostingRuleBuilder {
        this._priority = priority;
        return this;
    }

    build(): ConfigurablePostingRule {
        Preconditions.checkArgument(this._name != null && this._name.trim().length > 0, "PostingRule name must be defined");
        Preconditions.checkArgument(this._eligibilityCondition != null, "EligibilityCondition must be defined");
        Preconditions.checkArgument(this._accountFinder != null, "AccountFinder must be defined");
        Preconditions.checkArgument(this._postingCalculator != null, "PostingCalculator must be defined");

        return new ConfigurablePostingRule(this._id, this._name, this._eligibilityCondition!, this._accountFinder!, this._postingCalculator!, this._priority);
    }
}
