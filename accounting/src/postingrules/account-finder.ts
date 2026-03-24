import { AccountId } from '../account-id.js';
import { AccountView } from '../account-view.js';
import { PostingContext } from './posting-context.js';
import { TargetAccounts } from './target-accounts.js';

export interface AccountFinder {
    findAccounts(context: PostingContext): TargetAccounts;
}

export const AccountFinderFactory = {
    fixed(tagOrAccountIds: string | Map<string, AccountId>, accountId?: AccountId): AccountFinder {
        if (typeof tagOrAccountIds === 'string') {
            const tag = tagOrAccountIds;
            const aid = accountId!;
            return {
                findAccounts(context: PostingContext): TargetAccounts {
                    const account = context.accountingFacade().findAccount(aid);
                    if (account == null) {
                        throw new Error("Account " + aid + " not found");
                    }
                    return TargetAccounts.of(new Map<string, AccountView>([[tag, account]]));
                }
            };
        }

        const accountIds = tagOrAccountIds;
        return {
            findAccounts(context: PostingContext): TargetAccounts {
                const accounts = new Map<string, AccountView>();
                for (const [tag, aid] of accountIds) {
                    const account = context.accountingFacade().findAccount(aid);
                    if (account == null) {
                        throw new Error("Account " + aid + " not found");
                    }
                    accounts.set(tag, account);
                }
                return TargetAccounts.of(accounts);
            }
        };
    }
};
