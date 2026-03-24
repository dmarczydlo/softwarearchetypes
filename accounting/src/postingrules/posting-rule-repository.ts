import { PostingContext } from './posting-context.js';
import { PostingRule } from './posting-rule.js';
import { PostingRuleId } from './posting-rule-id.js';

export interface PostingRuleRepository {
    findAll(): PostingRule[];
    find(id: PostingRuleId): PostingRule | null;
    save(rule: PostingRule): void;
    delete(id: PostingRuleId): void;
    findEligibleRules(context: PostingContext): PostingRule[];
}

export class InMemoryPostingRuleRepository implements PostingRuleRepository {
    private readonly rules = new Map<string, PostingRule>();

    findAll(): PostingRule[] {
        return Array.from(this.rules.values());
    }

    find(id: PostingRuleId): PostingRule | null {
        return this.rules.get(id.uuid) ?? null;
    }

    save(rule: PostingRule): void {
        this.rules.set(rule.id().uuid, rule);
    }

    delete(id: PostingRuleId): void {
        this.rules.delete(id.uuid);
    }

    findEligibleRules(context: PostingContext): PostingRule[] {
        return Array.from(this.rules.values()).filter(rule => rule.isEligible(context));
    }
}
