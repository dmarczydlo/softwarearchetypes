import { ResultFactory, Result } from '@softwarearchetypes/common';
import { AccountingFacade } from '../accounting-facade.js';
import { EntryView } from '../entry-view.js';
import { TransactionId } from '../transaction-id.js';
import { PostingContext } from './posting-context.js';
import { PostingRule } from './posting-rule.js';
import { PostingRuleExecutor } from './posting-rule-executor.js';
import { PostingRuleId } from './posting-rule-id.js';
import { PostingRuleRepository } from './posting-rule-repository.js';

export class PostingRulesFacade {
    private readonly postingRuleRepository: PostingRuleRepository;
    private readonly postingRuleExecutor: PostingRuleExecutor;
    private readonly accountingFacade: AccountingFacade;
    private readonly clock: () => Date;

    constructor(
        postingRuleRepository: PostingRuleRepository,
        postingRuleExecutor: PostingRuleExecutor,
        accountingFacade: AccountingFacade,
        clock: () => Date
    ) {
        this.postingRuleRepository = postingRuleRepository;
        this.postingRuleExecutor = postingRuleExecutor;
        this.accountingFacade = accountingFacade;
        this.clock = clock;
    }

    saveRule(rule: PostingRule): Result<string, PostingRuleId> {
        try {
            this.postingRuleRepository.save(rule);
            return ResultFactory.success(rule.id());
        } catch (ex: unknown) {
            return ResultFactory.failure((ex as Error).message);
        }
    }

    deleteRule(id: PostingRuleId): Result<string, PostingRuleId> {
        try {
            this.postingRuleRepository.delete(id);
            return ResultFactory.success(id);
        } catch (ex: unknown) {
            return ResultFactory.failure((ex as Error).message);
        }
    }

    findRule(id: PostingRuleId): PostingRule | null {
        return this.postingRuleRepository.find(id);
    }

    findAllRules(): PostingRule[] {
        return this.postingRuleRepository.findAll();
    }

    executeRulesFor(triggeringEntries: EntryView[]): Result<string, Set<TransactionId>> {
        const context = new PostingContext(triggeringEntries, this.accountingFacade, this.clock);
        return this.postingRuleExecutor.executeEligibleRules(context, (tx) => this.accountingFacade.executeSingle(tx));
    }
}
