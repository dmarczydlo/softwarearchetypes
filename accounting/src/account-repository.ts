import { Account } from './account.js';
import { AccountId } from './account-id.js';
import { EntryRepository } from './entry-repository.js';
import { ProjectionAccount } from './projection-account.js';

export interface AccountRepository {
    find(accountId: AccountId): Account | null;
    findProjectionAccount(accountId: AccountId): ProjectionAccount | null;
    saveAccount(account: Account): void;
    saveAccounts(accounts: Account[]): void;
    saveProjectionAccount(account: ProjectionAccount): void;
    findAll(): Account[];
    findSet(accounts: Set<AccountId>): Map<AccountId, Account>;
    findProjectionAccounts(accounts: Set<AccountId>): Map<AccountId, ProjectionAccount>;
    findAllProjectionAccounts(): ProjectionAccount[];
}

export class InMemoryAccountRepo implements AccountRepository {
    private readonly accounts = new Map<string, Account>();
    private readonly projectionAccounts = new Map<string, ProjectionAccount>();
    private readonly entryRepository: EntryRepository;

    constructor(entryRepository: EntryRepository) {
        this.entryRepository = entryRepository;
    }

    find(accountId: AccountId): Account | null {
        return this.getAccount(accountId);
    }

    findProjectionAccount(accountId: AccountId): ProjectionAccount | null {
        return this.projectionAccounts.get(accountId.uuid) ?? null;
    }

    saveAccount(account: Account): void {
        for (const entry of account.entries().stream()) {
            this.entryRepository.save(entry);
        }
        this.accounts.set(account.id().uuid, account);
    }

    saveAccounts(accounts: Account[]): void {
        accounts.forEach(acc => {
            for (const entry of acc.entries().stream()) {
                this.entryRepository.save(entry);
            }
            this.accounts.set(acc.id().uuid, acc);
        });
    }

    saveProjectionAccount(projection: ProjectionAccount): void {
        this.projectionAccounts.set(projection.id().uuid, projection);
    }

    findAll(): Account[] {
        return Array.from(this.accounts.values());
    }

    findSet(accountIds: Set<AccountId>): Map<AccountId, Account> {
        const result = new Map<AccountId, Account>();
        for (const accountId of accountIds) {
            if (this.accounts.has(accountId.uuid) || this.projectionAccounts.has(accountId.uuid)) {
                const account = this.getAccount(accountId);
                if (account != null) {
                    result.set(accountId, account);
                }
            }
        }
        return result;
    }

    findProjectionAccounts(accountIds: Set<AccountId>): Map<AccountId, ProjectionAccount> {
        const result = new Map<AccountId, ProjectionAccount>();
        for (const accountId of accountIds) {
            const projection = this.projectionAccounts.get(accountId.uuid);
            if (projection != null) {
                result.set(accountId, projection);
            }
        }
        return result;
    }

    findAllProjectionAccounts(): ProjectionAccount[] {
        return Array.from(this.projectionAccounts.values());
    }

    private getAccount(accountId: AccountId): Account | null {
        const account = this.accounts.get(accountId.uuid);
        if (account != null) {
            return account;
        }
        const projection = this.projectionAccounts.get(accountId.uuid);
        if (projection != null) {
            return this.getProjection(accountId);
        }
        return null;
    }

    private getProjection(accountId: AccountId): Account {
        return new Account(accountId, null, null, undefined, this.projectionAccounts.get(accountId.uuid)!.version());
    }
}
