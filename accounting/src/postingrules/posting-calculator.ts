import { Transaction } from '../transaction.js';
import { PostingContext } from './posting-context.js';
import { TargetAccounts } from './target-accounts.js';

export interface PostingCalculator {
    calculate(accounts: TargetAccounts, context: PostingContext): Transaction[];
}
