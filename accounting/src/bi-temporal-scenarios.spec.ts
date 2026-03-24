import { describe, it, expect } from 'vitest';
import { Money } from '@softwarearchetypes/quantity';
import { AccountId } from './account-id.js';
import { AccountingConfiguration } from './accounting-configuration.js';
import { CreateAccount } from './create-account.js';
import { TransactionType } from './transaction-type.js';

const MONDAY_10_00 = new Date(2022, 1, 1, 10, 0);
const TUESDAY_10_00 = new Date(2022, 1, 2, 10, 0);
const WEDNESDAY_10_00 = new Date(2022, 1, 3, 10, 0);
const NOW = new Date(2022, 1, 2, 12, 50);

function createFacade() { return AccountingConfiguration.inMemory(() => NOW).facade(); }
function createAssetAccount(facade: ReturnType<typeof createFacade>, name: string): AccountId {
    const id = AccountId.generate();
    facade.createAccount(CreateAccount.generateAssetAccount(id, name));
    return id;
}

describe('BiTemporalScenarios', () => {
    it('backdated entry should affect historical balance', () => {
        const facade = createFacade();
        const account = createAssetAccount(facade, "Account");
        const offset = createAssetAccount(facade, "Offset");

        const tuesdayTx = facade.transaction().occurredAt(TUESDAY_10_00).appliesAt(TUESDAY_10_00).withTypeOf(TransactionType.TRANSFER).executing()
            .creditTo(account, Money.pln(100)).debitFrom(offset, Money.pln(100)).build();
        facade.executeSingle(tuesdayTx);

        const backdatedTx = facade.transaction().occurredAt(WEDNESDAY_10_00).appliesAt(MONDAY_10_00).withTypeOf(TransactionType.TRANSFER).executing()
            .creditTo(account, Money.pln(50)).debitFrom(offset, Money.pln(50)).build();
        facade.executeSingle(backdatedTx);

        expect(facade.balance(account)!.equals(Money.pln(150))).toBe(true);
        expect(facade.balanceAsOf(account, MONDAY_10_00)!.equals(Money.pln(50))).toBe(true);
        expect(facade.balanceAsOf(account, TUESDAY_10_00)!.equals(Money.pln(150))).toBe(true);
    });

    it('future dated entry should not affect current balance until application time', () => {
        const facade = createFacade();
        const account = createAssetAccount(facade, "Account");
        const offset = createAssetAccount(facade, "Offset");

        const mondayTx = facade.transaction().occurredAt(MONDAY_10_00).appliesAt(MONDAY_10_00).withTypeOf(TransactionType.TRANSFER).executing()
            .creditTo(account, Money.pln(100)).debitFrom(offset, Money.pln(100)).build();
        facade.executeSingle(mondayTx);

        const futureDatedTx = facade.transaction().occurredAt(MONDAY_10_00).appliesAt(WEDNESDAY_10_00).withTypeOf(TransactionType.TRANSFER).executing()
            .creditTo(account, Money.pln(200)).debitFrom(offset, Money.pln(200)).build();
        facade.executeSingle(futureDatedTx);

        expect(facade.balanceAsOf(account, MONDAY_10_00)!.equals(Money.pln(100))).toBe(true);
        expect(facade.balanceAsOf(account, TUESDAY_10_00)!.equals(Money.pln(100))).toBe(true);
        expect(facade.balanceAsOf(account, WEDNESDAY_10_00)!.equals(Money.pln(300))).toBe(true);
    });
});
