import { describe, it, expect } from 'vitest';
import { Money } from '@softwarearchetypes/quantity';
import { AccountId } from './account-id.js';
import { AccountType } from './account-type.js';
import { AccountingConfiguration } from './accounting-configuration.js';
import { CreateAccount } from './create-account.js';
import { randomStringWithPrefixOf } from './random-fixture.js';

const NOW = new Date(2022, 1, 2, 12, 50);
function createFacade() {
    return AccountingConfiguration.inMemory(() => NOW).facade();
}

describe('AccountsFindScenarios', () => {
    it('should find existing account', () => {
        const facade = createFacade();
        const accountId = AccountId.generate();
        facade.createAccount(CreateAccount.generateAssetAccount(accountId, randomStringWithPrefixOf("acc")));
        const result = facade.findAccount(accountId);
        expect(result).not.toBeNull();
        expect(result!.id.uuid).toBe(accountId.uuid);
        expect(result!.type).toBe(AccountType.ASSET.toString());
        expect(result!.entries).toHaveLength(0);
    });

    it('should return null for non existing account', () => {
        const facade = createFacade();
        expect(facade.findAccount(AccountId.generate())).toBeNull();
    });

    it('should find account with transactions', () => {
        const facade = createFacade();
        const accountId = AccountId.generate();
        const paymentAccountId = AccountId.generate();
        facade.createAccount(CreateAccount.generateAssetAccount(paymentAccountId, randomStringWithPrefixOf("acc")));
        facade.createAccount(CreateAccount.generateAssetAccount(accountId, randomStringWithPrefixOf("acc")));
        facade.transfer(paymentAccountId, accountId, Money.pln(100), NOW, NOW);
        const result = facade.findAccount(accountId);
        expect(result).not.toBeNull();
        expect(result!.id.uuid).toBe(accountId.uuid);
        expect(result!.entries).toHaveLength(1);
        expect(result!.entries[0].amount.equals(Money.pln(100))).toBe(true);
    });

    it('should find account with name', () => {
        const facade = createFacade();
        const accountId = AccountId.generate();
        const name = randomStringWithPrefixOf("Test Account Name");
        facade.createAccount(new CreateAccount(accountId, name, "ASSET"));
        const result = facade.findAccount(accountId);
        expect(result).not.toBeNull();
        expect(result!.name).toBe(name);
    });

    it('should find all accounts', () => {
        const facade = createFacade();
        const req1 = CreateAccount.generateAssetAccount(AccountId.generate(), randomStringWithPrefixOf("acc"));
        const req2 = CreateAccount.generateAssetAccount(AccountId.generate(), randomStringWithPrefixOf("acc"));
        facade.createAccount(req1);
        facade.createAccount(req2);
        const result = facade.findAccounts(new Set([req1.accountId, req2.accountId]));
        expect(result).toHaveLength(2);
    });

    it('should return empty list when accounts not present', () => {
        const facade = createFacade();
        facade.createAccount(CreateAccount.generateAssetAccount(AccountId.generate(), randomStringWithPrefixOf("acc")));
        const result = facade.findAccounts(new Set([AccountId.generate(), AccountId.generate()]));
        expect(result).toHaveLength(0);
    });
});
