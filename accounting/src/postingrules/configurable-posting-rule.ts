import { Preconditions } from '@softwarearchetypes/common';
import { Transaction } from '../transaction.js';
import { AccountFinder } from './account-finder.js';
import { EligibilityCondition } from './eligibility-condition.js';
import { PostingCalculator } from './posting-calculator.js';
import { PostingContext } from './posting-context.js';
import { PostingRule } from './posting-rule.js';
import { PostingRuleId } from './posting-rule-id.js';

export class ConfigurablePostingRule implements PostingRule {
    private readonly _id: PostingRuleId;
    private readonly _name: string;
    private readonly eligibilityCondition: EligibilityCondition;
    private readonly accountFinder: AccountFinder;
    private readonly postingCalculator: PostingCalculator;
    private readonly _priority: number;

    constructor(
        id: PostingRuleId,
        name: string,
        eligibilityCondition: EligibilityCondition,
        accountFinder: AccountFinder,
        postingCalculator: PostingCalculator,
        priority: number = 100
    ) {
        Preconditions.checkArgument(id != null, "PostingRule ID must be defined");
        Preconditions.checkArgument(name != null && name.trim().length > 0, "PostingRule name must be defined");
        Preconditions.checkArgument(eligibilityCondition != null, "EligibilityCondition must be defined");
        Preconditions.checkArgument(accountFinder != null, "AccountFinder must be defined");
        Preconditions.checkArgument(postingCalculator != null, "PostingCalculator must be defined");

        this._id = id;
        this._name = name;
        this.eligibilityCondition = eligibilityCondition;
        this.accountFinder = accountFinder;
        this.postingCalculator = postingCalculator;
        this._priority = priority;
    }

    id(): PostingRuleId {
        return this._id;
    }

    name(): string {
        return this._name;
    }

    isEligible(context: PostingContext): boolean {
        return this.eligibilityCondition.test(context);
    }

    execute(context: PostingContext): Transaction[] {
        if (this.isEligible(context)) {
            const accounts = this.accountFinder.findAccounts(context);
            return this.postingCalculator.calculate(accounts, context);
        }
        return [];
    }

    priority(): number {
        return this._priority;
    }
}
