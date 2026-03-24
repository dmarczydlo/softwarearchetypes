import { Transaction } from '../transaction.js';
import { PostingContext } from './posting-context.js';
import { PostingRuleId } from './posting-rule-id.js';

export interface PostingRule {
    id(): PostingRuleId;
    name(): string;
    isEligible(context: PostingContext): boolean;
    execute(context: PostingContext): Transaction[];
    priority(): number;
}
