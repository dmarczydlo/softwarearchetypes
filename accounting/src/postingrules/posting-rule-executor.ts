import { ResultFactory, Result, CompositeSetResult } from '@softwarearchetypes/common';
import { Transaction } from '../transaction.js';
import { TransactionId } from '../transaction-id.js';
import { PostingContext } from './posting-context.js';
import { PostingRule } from './posting-rule.js';
import { PostingRuleRepository } from './posting-rule-repository.js';

export class PostingRuleExecutor {
    private readonly postingRuleRepository: PostingRuleRepository;

    constructor(postingRuleRepository: PostingRuleRepository) {
        this.postingRuleRepository = postingRuleRepository;
    }

    executeEligibleRules(
        context: PostingContext,
        transactionExecutor: (transaction: Transaction) => Result<string, TransactionId>
    ): Result<string, Set<TransactionId>> {
        const rules = this.postingRuleRepository.findEligibleRules(context)
            .sort((a, b) => a.priority() - b.priority());
        return this.executeRulesWithExecutor(rules, context, transactionExecutor);
    }

    private executeRulesWithExecutor(
        rules: PostingRule[],
        context: PostingContext,
        transactionExecutor: (transaction: Transaction) => Result<string, TransactionId>
    ): Result<string, Set<TransactionId>> {
        const compositeResult = CompositeSetResult.fromSet<string, TransactionId>(new Set());
        for (const rule of rules) {
            if (rule.isEligible(context)) {
                for (const tx of rule.execute(context)) {
                    const accumulated = compositeResult.accumulate(transactionExecutor(tx));
                    if (accumulated.failure()) {
                        return accumulated.toResult();
                    }
                }
            }
        }
        return compositeResult.toResult();
    }

    executeRules(rules: PostingRule[], context: PostingContext): Transaction[] {
        return rules
            .filter(rule => rule.isEligible(context))
            .sort((a, b) => a.priority() - b.priority())
            .flatMap(rule => rule.execute(context));
    }

    executeRule(rule: PostingRule, context: PostingContext): Transaction[] {
        if (rule.isEligible(context)) {
            return rule.execute(context);
        }
        return [];
    }
}
