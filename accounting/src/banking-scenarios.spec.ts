import { describe, it, expect } from 'vitest';
import { Money } from '@softwarearchetypes/quantity';
import { AccountId } from './account-id.js';
import { AccountingConfiguration } from './accounting-configuration.js';
import { CreateAccount } from './create-account.js';

const MONDAY_10_00 = new Date(2022, 1, 1, 10, 0);
const TUESDAY_10_00 = new Date(2022, 1, 2, 10, 0);
const NOW = new Date(2022, 1, 2, 12, 50);

function createFacade() {
    return AccountingConfiguration.inMemory(() => NOW).facade();
}

function createAssetAccount(facade: ReturnType<typeof createFacade>, name: string): AccountId {
    const id = AccountId.generate();
    facade.createAccount(CreateAccount.generateAssetAccount(id, name));
    return id;
}

function createOffBalanceAccount(facade: ReturnType<typeof createFacade>, name: string): AccountId {
    const id = AccountId.generate();
    facade.createAccount(CreateAccount.generateOffBalanceAccount(id, name));
    return id;
}

describe('BankingScenarios', () => {
    it('loan repayment should be split into principal interest and fees', () => {
        const facade = createFacade();
        const cashAccount = createAssetAccount(facade, "Cash");
        const principalReceivable = createAssetAccount(facade, "Principal Receivable");
        const interestReceivable = createAssetAccount(facade, "Interest Receivable");
        const feeReceivable = createAssetAccount(facade, "Fee Receivable");

        facade.transfer(cashAccount, principalReceivable, Money.pln(10000), MONDAY_10_00, MONDAY_10_00);
        facade.transfer(cashAccount, interestReceivable, Money.pln(500), MONDAY_10_00, MONDAY_10_00);
        facade.transfer(cashAccount, feeReceivable, Money.pln(100), MONDAY_10_00, MONDAY_10_00);

        const repayment = facade.transaction()
            .occurredAt(TUESDAY_10_00)
            .appliesAt(TUESDAY_10_00)
            .withTypeOf("loan_repayment")
            .executing()
            .creditTo(cashAccount, Money.pln(1060))
            .debitFrom(principalReceivable, Money.pln(1000))
            .debitFrom(interestReceivable, Money.pln(50))
            .debitFrom(feeReceivable, Money.pln(10))
            .build();

        const result = facade.executeSingle(repayment);
        expect(result.success()).toBe(true);
        expect(facade.balance(cashAccount)!.equals(Money.pln(-9540))).toBe(true);
        expect(facade.balance(principalReceivable)!.equals(Money.pln(9000))).toBe(true);
        expect(facade.balance(interestReceivable)!.equals(Money.pln(450))).toBe(true);
        expect(facade.balance(feeReceivable)!.equals(Money.pln(90))).toBe(true);
    });

    it('loan repayment with off balance tracking per customer', () => {
        const facade = createFacade();
        const cashAccount = createAssetAccount(facade, "Cash");
        const principalReceivable = createAssetAccount(facade, "Principal Receivable");
        const mariaPrincipal = createOffBalanceAccount(facade, "Maria - Principal");
        const janPrincipal = createOffBalanceAccount(facade, "Jan - Principal");

        const mariaRepayment = facade.transaction()
            .occurredAt(TUESDAY_10_00).appliesAt(TUESDAY_10_00).withTypeOf("loan_repayment").executing()
            .creditTo(cashAccount, Money.pln(500)).debitFrom(principalReceivable, Money.pln(500)).debitFrom(mariaPrincipal, Money.pln(500)).build();

        const janRepayment = facade.transaction()
            .occurredAt(TUESDAY_10_00).appliesAt(TUESDAY_10_00).withTypeOf("loan_repayment").executing()
            .creditTo(cashAccount, Money.pln(300)).debitFrom(principalReceivable, Money.pln(300)).debitFrom(janPrincipal, Money.pln(300)).build();

        expect(facade.executeMultiple(mariaRepayment, janRepayment).success()).toBe(true);
        expect(facade.balance(cashAccount)!.equals(Money.pln(800))).toBe(true);
        expect(facade.balance(principalReceivable)!.equals(Money.pln(-800))).toBe(true);
        expect(facade.balance(mariaPrincipal)!.equals(Money.pln(-500))).toBe(true);
        expect(facade.balance(janPrincipal)!.equals(Money.pln(-300))).toBe(true);
    });
});
