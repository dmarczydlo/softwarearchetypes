import { describe, it, expect } from 'vitest';
import { Money } from '@softwarearchetypes/quantity';
import { AccountId } from './account-id.js';
import { AccountingConfiguration } from './accounting-configuration.js';
import { CreateAccount } from './create-account.js';
import { TransactionType } from './transaction-type.js';
import { EntryType } from './entry-view.js';
import { randomStringWithPrefixOf } from './random-fixture.js';
import { TransactionViewAssert } from './transaction-view-assert.js';

const TUESDAY_10_00 = new Date(2022, 1, 2, 10, 0);
const TUESDAY_11_00 = new Date(2022, 1, 2, 11, 0);
const TUESDAY_12_00 = new Date(2022, 1, 2, 12, 0);
const NOW = new Date(2022, 1, 2, 12, 50);

function createFacade() {
    return AccountingConfiguration.inMemory(() => NOW).facade();
}

function generateAssetAccount(facade: ReturnType<typeof createFacade>): AccountId {
    const creation = CreateAccount.generateAssetAccount(randomStringWithPrefixOf("acc"));
    expect(facade.createAccount(creation).success()).toBe(true);
    return creation.accountId;
}

describe('AccountingCreditDebitScenarios', () => {
    it('should return zero balance for empty account', () => {
        const facade = createFacade();
        const accountId = AccountId.generate();
        expect(facade.createAccount(CreateAccount.generateAssetAccount(accountId, randomStringWithPrefixOf("acc"))).success()).toBe(true);

        const balance = facade.balance(accountId);
        expect(balance).not.toBeNull();
        expect(balance!.equals(Money.zeroPln())).toBe(true);
    });

    it('should have no transactions registered for empty account', () => {
        const facade = createFacade();
        const accountId = AccountId.generate();
        expect(facade.createAccount(CreateAccount.generateAssetAccount(accountId, randomStringWithPrefixOf("acc"))).success()).toBe(true);

        const transactions = facade.findTransactionIdsFor(accountId);
        expect(transactions).toHaveLength(0);
    });

    it('should return single entry balance', () => {
        const facade = createFacade();
        const creditedAccount = generateAssetAccount(facade);
        const debitedAccount = generateAssetAccount(facade);

        const result = facade.transfer(debitedAccount, creditedAccount, Money.pln(100), TUESDAY_10_00, TUESDAY_10_00);
        expect(result.success()).toBe(true);

        const creditBalance = facade.balance(creditedAccount);
        const debitBalance = facade.balance(debitedAccount);
        expect(creditBalance!.equals(Money.pln(100))).toBe(true);
        expect(debitBalance!.equals(Money.pln(-100))).toBe(true);
    });

    it('should find the same transaction executed on accounts', () => {
        const facade = createFacade();
        const creditedAccount = generateAssetAccount(facade);
        const debitedAccount = generateAssetAccount(facade);

        const result = facade.transfer(debitedAccount, creditedAccount, Money.pln(100), TUESDAY_10_00, TUESDAY_10_00);
        expect(result.success()).toBe(true);

        const creditedTxs = facade.findTransactionIdsFor(creditedAccount);
        const debitedTxs = facade.findTransactionIdsFor(debitedAccount);

        expect(creditedTxs).toHaveLength(1);
        expect(debitedTxs).toHaveLength(1);
        expect(creditedTxs[0].value).toBe(debitedTxs[0].value);
    });

    it('should find transaction executed on accounts', () => {
        const facade = createFacade();
        const creditedAccount = generateAssetAccount(facade);
        const debitedAccount1 = generateAssetAccount(facade);
        const debitedAccount2 = generateAssetAccount(facade);

        const transaction = facade.transaction()
            .withTypeOf(TransactionType.TRANSFER)
            .occurredAt(TUESDAY_10_00)
            .appliesAt(TUESDAY_10_00)
            .executing()
            .creditTo(creditedAccount, Money.pln(100))
            .debitFrom(debitedAccount1, Money.pln(60))
            .debitFrom(debitedAccount2, Money.pln(40))
            .build();

        const result = facade.executeSingle(transaction);
        expect(result.success()).toBe(true);

        const view = facade.findTransactionBy(transaction.id());
        expect(view).not.toBeNull();

        TransactionViewAssert.assertThat(view!)
            .hasId(transaction.id())
            .hasType(TransactionType.TRANSFER)
            .occurredAt(TUESDAY_10_00)
            .appliesAt(TUESDAY_10_00)
            .containsEntries()
            .containExactlyOneEntry(creditedAccount, EntryType.CREDIT, Money.pln(100))
            .containExactlyOneEntry(debitedAccount1, EntryType.DEBIT, Money.pln(-60))
            .containExactlyOneEntry(debitedAccount2, EntryType.DEBIT, Money.pln(-40))
            .containExactly(3)
            .allOccurredAt(TUESDAY_10_00)
            .allHaveTransactionId(transaction.id());
    });

    it('should support going back in time', () => {
        const facade = createFacade();
        const account = generateAssetAccount(facade);
        const paymentAccount = generateAssetAccount(facade);

        const r1 = facade.transfer(paymentAccount, account, Money.pln(100), TUESDAY_10_00, TUESDAY_10_00);
        const r2 = facade.transfer(account, paymentAccount, Money.pln(30), TUESDAY_11_00, TUESDAY_11_00);
        const r3 = facade.transfer(account, paymentAccount, Money.pln(30), TUESDAY_12_00, TUESDAY_12_00);

        expect(r1.success()).toBe(true);
        expect(r2.success()).toBe(true);
        expect(r3.success()).toBe(true);

        expect(facade.balanceAsOf(account, TUESDAY_10_00)!.equals(Money.pln(100))).toBe(true);
        expect(facade.balanceAsOf(account, TUESDAY_11_00)!.equals(Money.pln(70))).toBe(true);
        expect(facade.balance(account)!.equals(Money.pln(40))).toBe(true);
    });

    it('should return balances for multiple accounts as of given time', () => {
        const facade = createFacade();
        const acc1 = generateAssetAccount(facade);
        const acc2 = generateAssetAccount(facade);
        const paymentAccount = generateAssetAccount(facade);

        expect(facade.transfer(paymentAccount, acc1, Money.pln(100), TUESDAY_10_00, TUESDAY_10_00).success()).toBe(true);
        expect(facade.transfer(paymentAccount, acc2, Money.pln(200), TUESDAY_10_00, TUESDAY_10_00).success()).toBe(true);
        expect(facade.transfer(acc2, paymentAccount, Money.pln(50), TUESDAY_11_00, TUESDAY_11_00).success()).toBe(true);

        const balances = facade.balancesAsOf(new Set([acc1, acc2]), TUESDAY_11_00);
        expect(balances.get(acc1)!.equals(Money.pln(100))).toBe(true);
        expect(balances.get(acc2)!.equals(Money.pln(150))).toBe(true);
    });
});
