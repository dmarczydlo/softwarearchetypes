import { describe, it, expect } from 'vitest';
import { Money } from '@softwarearchetypes/quantity';
import { AccountId } from './account-id.js';
import { AccountingConfiguration } from './accounting-configuration.js';
import { CreateAccount } from './create-account.js';

const MONDAY_10_00 = new Date(2022, 1, 1, 10, 0);
const TUESDAY_10_00 = new Date(2022, 1, 2, 10, 0);
const NOW = new Date(2022, 1, 2, 12, 50);

function createFacade() { return AccountingConfiguration.inMemory(() => NOW).facade(); }
function createAssetAccount(facade: ReturnType<typeof createFacade>, name: string): AccountId {
    const id = AccountId.generate(); facade.createAccount(CreateAccount.generateAssetAccount(id, name)); return id;
}
function createAccountOfType(facade: ReturnType<typeof createFacade>, name: string, type: string): AccountId {
    const id = AccountId.generate(); facade.createAccount(new CreateAccount(id, name, type)); return id;
}

describe('EcommerceScenarios', () => {
    it('customer refund should properly handle vat', () => {
        const facade = createFacade();
        const cashAccount = createAssetAccount(facade, "Cash");
        const revenueAccount = createAccountOfType(facade, "Sales Revenue", "REVENUE");
        const vatPayable = createAccountOfType(facade, "VAT Payable", "LIABILITY");

        const sale = facade.transaction().occurredAt(MONDAY_10_00).appliesAt(MONDAY_10_00).withTypeOf("sale").executing()
            .creditTo(cashAccount, Money.pln(123)).debitFrom(revenueAccount, Money.pln(100)).debitFrom(vatPayable, Money.pln(23)).build();
        facade.executeSingle(sale);

        const refund = facade.transaction().occurredAt(TUESDAY_10_00).appliesAt(TUESDAY_10_00).withTypeOf("refund").executing()
            .debitFrom(cashAccount, Money.pln(123)).creditTo(revenueAccount, Money.pln(100)).creditTo(vatPayable, Money.pln(23)).build();
        const result = facade.executeSingle(refund);

        expect(result.isSuccess()).toBe(true);
        expect(facade.balance(cashAccount)!.equals(Money.zeroPln())).toBe(true);
        expect(facade.balance(revenueAccount)!.equals(Money.zeroPln())).toBe(true);
        expect(facade.balance(vatPayable)!.equals(Money.zeroPln())).toBe(true);
    });

    it('partial refund should correctly split vat', () => {
        const facade = createFacade();
        const cashAccount = createAssetAccount(facade, "Cash");
        const revenueAccount = createAccountOfType(facade, "Sales Revenue", "REVENUE");
        const vatPayable = createAccountOfType(facade, "VAT Payable", "LIABILITY");

        const sale = facade.transaction().occurredAt(MONDAY_10_00).appliesAt(MONDAY_10_00).withTypeOf("sale").executing()
            .creditTo(cashAccount, Money.pln(246)).debitFrom(revenueAccount, Money.pln(200)).debitFrom(vatPayable, Money.pln(46)).build();
        facade.executeSingle(sale);

        const partialRefund = facade.transaction().occurredAt(TUESDAY_10_00).appliesAt(TUESDAY_10_00).withTypeOf("partial_refund").executing()
            .debitFrom(cashAccount, Money.pln(123)).creditTo(revenueAccount, Money.pln(100)).creditTo(vatPayable, Money.pln(23)).build();
        const result = facade.executeSingle(partialRefund);

        expect(result.isSuccess()).toBe(true);
        expect(facade.balance(cashAccount)!.equals(Money.pln(123))).toBe(true);
        expect(facade.balance(revenueAccount)!.equals(Money.pln(-100))).toBe(true);
        expect(facade.balance(vatPayable)!.equals(Money.pln(-23))).toBe(true);
    });
});
