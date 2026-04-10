import { describe, it, expect } from 'vitest';
import { Money } from '@softwarearchetypes/quantity';
import { AccountId } from './account-id.js';
import { AccountAmounts } from './account-amounts.js';
import { AccountingConfiguration } from './accounting-configuration.js';
import { CreateAccount } from './create-account.js';

const NOW = new Date(2022, 1, 2, 12, 50);
function createFacade() {
    return AccountingConfiguration.inMemory(() => NOW).facade();
}

describe('AccountsCreatingScenarios', () => {
    it('can create asset account', () => {
        const facade = createFacade();
        const accountId = AccountId.generate();
        const result = facade.createAccount(CreateAccount.generateAssetAccount(accountId, "Cash"));
        expect(result.success()).toBe(true);
        const account = facade.findAccount(accountId);
        expect(account).not.toBeNull();
        expect(account!.type).toBe("ASSET");
        expect(account!.name).toBe("Cash");
        expect(account!.balance.equals(Money.zeroPln())).toBe(true);
    });

    it('can create liability account', () => {
        const facade = createFacade();
        const accountId = AccountId.generate();
        const result = facade.createAccount(new CreateAccount(accountId, "Customer Deposits", "LIABILITY"));
        expect(result.success()).toBe(true);
        const account = facade.findAccount(accountId);
        expect(account).not.toBeNull();
        expect(account!.type).toBe("LIABILITY");
    });

    it('can create revenue account', () => {
        const facade = createFacade();
        const accountId = AccountId.generate();
        const result = facade.createAccount(new CreateAccount(accountId, "Sales Revenue", "REVENUE"));
        expect(result.success()).toBe(true);
        const account = facade.findAccount(accountId);
        expect(account).not.toBeNull();
        expect(account!.type).toBe("REVENUE");
    });

    it('can create expense account', () => {
        const facade = createFacade();
        const accountId = AccountId.generate();
        const result = facade.createAccount(new CreateAccount(accountId, "Commission Expenses", "EXPENSE"));
        expect(result.success()).toBe(true);
        const account = facade.findAccount(accountId);
        expect(account).not.toBeNull();
        expect(account!.type).toBe("EXPENSE");
    });

    it('can create off balance account', () => {
        const facade = createFacade();
        const accountId = AccountId.generate();
        const result = facade.createAccount(CreateAccount.generateOffBalanceAccount(accountId, "Fleet Card Limit"));
        expect(result.success()).toBe(true);
        const account = facade.findAccount(accountId);
        expect(account).not.toBeNull();
        expect(account!.type).toBe("OFF_BALANCE");
    });

    it('cannot create account with duplicate id', () => {
        const facade = createFacade();
        const accountId = AccountId.generate();
        facade.createAccount(CreateAccount.generateAssetAccount(accountId, "First Account"));
        const result = facade.createAccount(CreateAccount.generateAssetAccount(accountId, "Second Account"));
        expect(result.success()).toBe(false);
        expect(result.getFailure()).toContain("already exists");
    });

    it('can create multiple accounts at once', () => {
        const facade = createFacade();
        const cash = AccountId.generate();
        const receivables = AccountId.generate();
        const payables = AccountId.generate();

        const requests = new Set([
            CreateAccount.generateAssetAccount(cash, "Cash"),
            CreateAccount.generateAssetAccount(receivables, "Receivables"),
            new CreateAccount(payables, "Payables", "LIABILITY")
        ]);

        const result = facade.createAccounts(requests);
        expect(result.success()).toBe(true);
        expect(facade.findAccount(cash)).not.toBeNull();
        expect(facade.findAccount(receivables)).not.toBeNull();
        expect(facade.findAccount(payables)).not.toBeNull();
    });

    it('cannot create accounts when some already exist', () => {
        const facade = createFacade();
        const existing = AccountId.generate();
        facade.createAccount(CreateAccount.generateAssetAccount(existing, "Existing"));
        const newAccount = AccountId.generate();
        const requests = new Set([
            CreateAccount.generateAssetAccount(existing, "Existing Again"),
            CreateAccount.generateAssetAccount(newAccount, "New Account")
        ]);
        const result = facade.createAccounts(requests);
        expect(result.success()).toBe(false);
        expect(result.getFailure()).toContain("already exists");
    });

    it('can create accounts with initial balances', () => {
        const facade = createFacade();
        const cash = AccountId.generate();
        const receivables = AccountId.generate();
        const requests = new Set([
            CreateAccount.generateAssetAccount(cash, "Cash"),
            CreateAccount.generateAssetAccount(receivables, "Receivables")
        ]);
        const initialBalances = AccountAmounts.of(new Map([
            [cash, Money.pln(1000)],
            [receivables, Money.pln(-1000)]
        ]));
        const result = facade.createAccountsWithInitialBalances(requests, initialBalances);
        expect(result.success()).toBe(true);
        expect(facade.balance(cash)!.equals(Money.pln(1000))).toBe(true);
        expect(facade.balance(receivables)!.equals(Money.pln(-1000))).toBe(true);
    });

    it('can find all accounts', () => {
        const facade = createFacade();
        const acc1 = AccountId.generate();
        const acc2 = AccountId.generate();
        facade.createAccount(CreateAccount.generateAssetAccount(acc1, "Account 1"));
        facade.createAccount(CreateAccount.generateAssetAccount(acc2, "Account 2"));
        const allAccounts = facade.findAll();
        expect(allAccounts.length).toBeGreaterThanOrEqual(2);
        expect(allAccounts.some(a => a.id.uuid === acc1.uuid)).toBe(true);
        expect(allAccounts.some(a => a.id.uuid === acc2.uuid)).toBe(true);
    });

    it('can find multiple accounts by ids', () => {
        const facade = createFacade();
        const acc1 = AccountId.generate();
        const acc2 = AccountId.generate();
        const acc3 = AccountId.generate();
        facade.createAccount(CreateAccount.generateAssetAccount(acc1, "Account 1"));
        facade.createAccount(CreateAccount.generateAssetAccount(acc2, "Account 2"));
        facade.createAccount(CreateAccount.generateAssetAccount(acc3, "Account 3"));
        const accounts = facade.findAccounts(new Set([acc1, acc3]));
        expect(accounts).toHaveLength(2);
        expect(accounts.some(a => a.id.uuid === acc1.uuid)).toBe(true);
        expect(accounts.some(a => a.id.uuid === acc3.uuid)).toBe(true);
    });

    it('find account returns null for non existing account', () => {
        const facade = createFacade();
        const nonExisting = AccountId.generate();
        expect(facade.findAccount(nonExisting)).toBeNull();
    });

    it('account name is preserved', () => {
        const facade = createFacade();
        const expectedName = "My Special Account Name";
        const accountId = AccountId.generate();
        facade.createAccount(CreateAccount.generateAssetAccount(accountId, expectedName));
        const account = facade.findAccount(accountId);
        expect(account).not.toBeNull();
        expect(account!.name).toBe(expectedName);
    });
});
