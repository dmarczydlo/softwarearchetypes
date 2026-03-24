import { describe, it, expect } from 'vitest';
import { Money } from '@softwarearchetypes/quantity';
import { Account } from './account.js';
import { AccountId } from './account-id.js';
import { AccountingConfiguration } from './accounting-configuration.js';
import { AccountRepository } from './account-repository.js';
import { CreateAccount } from './create-account.js';
import { EntryAllocationFilterBuilder } from './entry-allocations.js';
import { EntryId } from './entry-id.js';
import { AccountCredited, AccountDebited, isAccountCredited, isAccountDebited } from './entry.js';
import { TransactionBuilderFactory } from './transaction-builder-factory.js';
import { TransactionId } from './transaction-id.js';
import { TransactionType } from './transaction-type.js';
import { MIN_2_ACCOUNTS_INVOLVED_CONSTRAINT, MIN_2_ENTRIES_CONSTRAINT } from './transaction.js';
import { Validity } from './validity.js';
import { randomStringWithPrefixOf } from './random-fixture.js';

const TUESDAY_10_00 = new Date(2022, 1, 2, 10, 0);
const TUESDAY_11_00 = new Date(2022, 1, 2, 11, 0);
const TUESDAY_12_00 = new Date(2022, 1, 2, 12, 0);
const NOW = new Date(2022, 1, 2, 12, 50);

function setup() {
    const configuration = AccountingConfiguration.inMemory(() => NOW);
    const facade = configuration.facade();
    const accountRepository = configuration.accountRepository();
    const transactionBuilderFactory = configuration.transactionBuilderFactory();
    return { facade, accountRepository, transactionBuilderFactory };
}

function generateAssetAccount(facade: ReturnType<typeof setup>['facade'], accountRepository: AccountRepository): Account {
    return generateAccountOfType(facade, accountRepository, "ASSET");
}

function generateOffBalanceAccount(facade: ReturnType<typeof setup>['facade'], accountRepository: AccountRepository): Account {
    return generateAccountOfType(facade, accountRepository, "OFF_BALANCE");
}

function generateAccountOfType(facade: ReturnType<typeof setup>['facade'], accountRepository: AccountRepository, type: string): Account {
    const accountId = AccountId.generate();
    facade.createAccount(new CreateAccount(accountId, randomStringWithPrefixOf("acc"), type));
    const account = accountRepository.find(accountId);
    if (account == null) throw new Error("Test error: account not created");
    return account;
}

describe('TransactionScenarios', () => {
    it('can create transaction with two entries', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const jan = generateAssetAccount(facade, accountRepository);
        const maria = generateAssetAccount(facade, accountRepository);

        const transaction = transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_11_00).appliesAt(TUESDAY_12_00).withTypeOf("opening_balance").executing()
            .creditTo(jan.id(), Money.pln(50)).debitFrom(maria.id(), Money.pln(50)).build();

        expect(transaction.occurredAt().getTime()).toBe(TUESDAY_11_00.getTime());
        expect(transaction.appliesAt().getTime()).toBe(TUESDAY_12_00.getTime());
        expect(transaction.type().value).toBe("opening_balance");
    });

    it('can execute transaction', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const jan = generateAssetAccount(facade, accountRepository);
        const maria = generateAssetAccount(facade, accountRepository);
        const rokita = generateOffBalanceAccount(facade, accountRepository);

        const transaction = transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_11_00).appliesAt(TUESDAY_12_00).withTypeOf("opening_balance").executing()
            .creditTo(jan.id(), Money.pln(50)).debitFrom(maria.id(), Money.pln(50)).debitFrom(rokita.id(), Money.pln(20)).build();

        transaction.execute();

        expect(transaction.occurredAt().getTime()).toBe(TUESDAY_11_00.getTime());
        expect(transaction.appliesAt().getTime()).toBe(TUESDAY_12_00.getTime());
    });

    it('can execute reverse transaction', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const jan = generateAssetAccount(facade, accountRepository);
        const maria = generateAssetAccount(facade, accountRepository);
        const rokita = generateOffBalanceAccount(facade, accountRepository);

        const toBeReversedTx = transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_10_00).appliesAt(TUESDAY_11_00).withTypeOf("opening_balance").executing()
            .creditTo(jan.id(), Money.pln(50)).debitFrom(maria.id(), Money.pln(50)).debitFrom(rokita.id(), Money.pln(20)).build();
        toBeReversedTx.execute();

        const revertingTx = transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_12_00).appliesAt(TUESDAY_12_00).reverting(toBeReversedTx).build();
        revertingTx.execute();

        expect(revertingTx.type().value).toBe(TransactionType.REVERSAL.value);
    });

    it('can execute reverse transaction by id', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const jan = generateAssetAccount(facade, accountRepository);
        const maria = generateAssetAccount(facade, accountRepository);
        const rokita = generateOffBalanceAccount(facade, accountRepository);

        const toBeReversedTx = transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_10_00).appliesAt(TUESDAY_11_00).withTypeOf("opening_balance").executing()
            .creditTo(jan.id(), Money.pln(50)).debitFrom(maria.id(), Money.pln(50)).debitFrom(rokita.id(), Money.pln(20)).build();
        expect(facade.executeSingle(toBeReversedTx).isSuccess()).toBe(true);

        const revertingTx = transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_12_00).appliesAt(TUESDAY_12_00).reverting(toBeReversedTx.id()).build();
        const result = facade.executeSingle(revertingTx);
        expect(result.isSuccess()).toBe(true);
        expect(revertingTx.type().value).toBe(TransactionType.REVERSAL.value);
    });

    it('cannot execute reverse transaction by id when ref transaction does not exist', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const jan = generateAssetAccount(facade, accountRepository);
        const maria = generateAssetAccount(facade, accountRepository);
        const rokita = generateOffBalanceAccount(facade, accountRepository);

        const transaction = transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_10_00).appliesAt(TUESDAY_11_00).withTypeOf("opening_balance").executing()
            .creditTo(jan.id(), Money.pln(50)).debitFrom(maria.id(), Money.pln(50)).debitFrom(rokita.id(), Money.pln(20)).build();
        transaction.execute();

        expect(() => transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_12_00).appliesAt(TUESDAY_12_00).reverting(transaction.id()).build()
        ).toThrow(`Transaction ${transaction.id().toString()} does not exist`);
    });

    it('cannot create transaction with no balancing constraint fulfilled', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const jan = generateAssetAccount(facade, accountRepository);
        const maria = generateAssetAccount(facade, accountRepository);

        expect(() => transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_11_00).appliesAt(TUESDAY_12_00).withTypeOf("opening_balance").executing()
            .debitFrom(jan.id(), Money.pln(100)).creditTo(maria.id(), Money.pln(80)).build()
        ).toThrow("Entry balance within transaction must always be 0");
    });

    it('cannot create transaction with single entry when the constraint is enabled', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const jan = generateAssetAccount(facade, accountRepository);

        expect(() => transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_11_00).appliesAt(TUESDAY_12_00).withTypeOf("opening_balance")
            .withTransactionEntriesConstraint(MIN_2_ENTRIES_CONSTRAINT).executing()
            .creditTo(jan.id(), Money.pln(50)).build()
        ).toThrow("Transaction must have at least 2 entries");
    });

    it('cannot create transaction with 2 entries addressing single account when the constraint is enabled', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const jan = generateAssetAccount(facade, accountRepository);

        expect(() => transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_11_00).appliesAt(TUESDAY_12_00).withTypeOf("opening_balance")
            .withTransactionEntriesConstraint(MIN_2_ACCOUNTS_INVOLVED_CONSTRAINT).executing()
            .creditTo(jan.id(), Money.pln(50)).debitFrom(jan.id(), Money.pln(50)).build()
        ).toThrow("Transaction must involve at least 2 accounts");
    });

    it('cannot create transaction without occurrence time', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const jan = generateAssetAccount(facade, accountRepository);
        const maria = generateAssetAccount(facade, accountRepository);

        expect(() => transactionBuilderFactory.transaction()
            .appliesAt(TUESDAY_12_00).withTypeOf("opening_balance").executing()
            .creditTo(jan.id(), Money.pln(50)).debitFrom(maria.id(), Money.pln(50)).build()
        ).toThrow("Transaction must have its occurrence time");
    });

    it('cannot create transaction without application time', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const jan = generateAssetAccount(facade, accountRepository);
        const maria = generateAssetAccount(facade, accountRepository);

        expect(() => transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_11_00).withTypeOf("opening_balance").executing()
            .creditTo(jan.id(), Money.pln(50)).debitFrom(maria.id(), Money.pln(50)).build()
        ).toThrow("Transaction must have its application time");
    });

    it('cannot create transaction without type', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const jan = generateAssetAccount(facade, accountRepository);
        const maria = generateAssetAccount(facade, accountRepository);

        expect(() => transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_11_00).appliesAt(TUESDAY_12_00).executing()
            .creditTo(jan.id(), Money.pln(50)).debitFrom(maria.id(), Money.pln(50)).build()
        ).toThrow("Transaction must have its type");
    });

    it('can create transaction provided transaction id', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const jan = generateAssetAccount(facade, accountRepository);
        const maria = generateAssetAccount(facade, accountRepository);
        const clientProvidedId = TransactionId.generate();

        const transaction = transactionBuilderFactory.transaction()
            .id(clientProvidedId).occurredAt(TUESDAY_11_00).appliesAt(TUESDAY_12_00).withTypeOf("client_payment").executing()
            .creditTo(jan.id(), Money.pln(100)).debitFrom(maria.id(), Money.pln(100)).build();

        expect(transaction.id().value).toBe(clientProvidedId.value);
    });

    it('can create transaction with validity periods', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const jan = generateAssetAccount(facade, accountRepository);
        const maria = generateAssetAccount(facade, accountRepository);
        const validUntilEndOfDay = Validity.until(new Date(NOW.getTime() + 86400000));

        const transaction = transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_11_00).appliesAt(TUESDAY_12_00).withTypeOf("credit_pool").executing()
            .creditTo(jan.id(), Money.pln(100), validUntilEndOfDay).debitFrom(maria.id(), Money.pln(100)).build();

        expect(transaction.occurredAt().getTime()).toBe(TUESDAY_11_00.getTime());
        expect(transaction.appliesAt().getTime()).toBe(TUESDAY_12_00.getTime());
    });

    it('can create transaction with applied to references', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const jan = generateAssetAccount(facade, accountRepository);
        const maria = generateAssetAccount(facade, accountRepository);

        const originalTransaction = transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_10_00).appliesAt(TUESDAY_11_00).withTypeOf("original").executing()
            .creditTo(jan.id(), Money.pln(100)).debitFrom(maria.id(), Money.pln(100)).build();
        expect(facade.executeSingle(originalTransaction).isSuccess()).toBe(true);

        const originalEntryId = Array.from(originalTransaction.entries().values()).flat()
            .filter(e => isAccountCredited(e)).map(e => e.id())[0];

        const correctionTransaction = transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_11_00).appliesAt(TUESDAY_12_00).withTypeOf("correction").executing()
            .creditTo(jan.id(), Money.pln(25), originalEntryId).debitFrom(maria.id(), Money.pln(25)).build();

        expect(correctionTransaction.occurredAt().getTime()).toBe(TUESDAY_11_00.getTime());
    });

    it('cannot create transaction with non existing applied to entry', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const jan = generateAssetAccount(facade, accountRepository);
        const maria = generateAssetAccount(facade, accountRepository);
        const nonExistingEntryId = EntryId.generate();

        expect(() => transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_11_00).appliesAt(TUESDAY_12_00).withTypeOf("correction").executing()
            .creditTo(jan.id(), Money.pln(25), nonExistingEntryId).debitFrom(maria.id(), Money.pln(25)).build()
        ).toThrow("No matching entry found for allocation");
    });

    it('should reject allocation filter when no matching entry found', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const jan = generateAssetAccount(facade, accountRepository);
        const maria = generateAssetAccount(facade, accountRepository);
        const nonExistingAccount = AccountId.generate();

        expect(() => transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_12_00).appliesAt(TUESDAY_12_00).withTypeOf("allocation_test").executing()
            .creditTo(jan.id(), Money.pln(50), EntryAllocationFilterBuilder.fifo(nonExistingAccount).build())
            .debitFrom(maria.id(), Money.pln(50)).build()
        ).toThrow("No matching entry found for allocation");
    });

    it('can compensate fully expired entry', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const creditAccount = generateAssetAccount(facade, accountRepository);
        const offsetAccount = generateAssetAccount(facade, accountRepository);
        const expiredValidity = Validity.until(TUESDAY_11_00);

        const originalTransaction = transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_10_00).appliesAt(TUESDAY_10_00).withTypeOf("credit_with_expiry").executing()
            .creditTo(creditAccount.id(), Money.pln(100), expiredValidity).debitFrom(offsetAccount.id(), Money.pln(100)).build();
        expect(facade.executeSingle(originalTransaction).isSuccess()).toBe(true);

        const expiredEntryId = Array.from(originalTransaction.entries().values()).flat()
            .filter(e => e.validity().equals(expiredValidity)).map(e => e.id())[0];

        const compensationTransaction = transactionBuilderFactory.transaction()
            .occurredAt(NOW).appliesAt(NOW).compensatingExpired(expiredEntryId)
            .withCompensationAccount(offsetAccount.id()).build();

        expect(compensationTransaction).not.toBeNull();
        expect(compensationTransaction!.type().value).toBe(TransactionType.EXPIRATION_COMPENSATION.value);
    });

    it('cannot compensate non expired entry', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const creditAccount = generateAssetAccount(facade, accountRepository);
        const offsetAccount = generateAssetAccount(facade, accountRepository);
        const validValidity = Validity.until(new Date(NOW.getTime() + 3600000));

        const originalTransaction = transactionBuilderFactory.transaction()
            .occurredAt(TUESDAY_10_00).appliesAt(TUESDAY_10_00).withTypeOf("credit_with_validity").executing()
            .creditTo(creditAccount.id(), Money.pln(100), validValidity).debitFrom(offsetAccount.id(), Money.pln(100)).build();
        expect(facade.executeSingle(originalTransaction).isSuccess()).toBe(true);

        const validEntryId = Array.from(originalTransaction.entries().values()).flat()
            .filter(e => e.validity().equals(validValidity)).map(e => e.id())[0];

        expect(() => transactionBuilderFactory.transaction()
            .occurredAt(NOW).appliesAt(NOW).compensatingExpired(validEntryId)
            .withCompensationAccount(offsetAccount.id()).build()
        ).toThrow("has not expired yet");
    });

    it('cannot compensate non existing entry', () => {
        const { facade, accountRepository, transactionBuilderFactory } = setup();
        const nonExistingEntryId = EntryId.generate();

        expect(() => transactionBuilderFactory.transaction()
            .occurredAt(NOW).appliesAt(NOW).compensatingExpired(nonExistingEntryId)
            .withCompensationAccount(generateAssetAccount(facade, accountRepository).id()).build()
        ).toThrow("Entry " + nonExistingEntryId + " does not exist");
    });
});
