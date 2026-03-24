import { describe, it, expect } from 'vitest';
import { Money } from '@softwarearchetypes/quantity';
import { AccountId } from './account-id.js';
import { AccountingConfiguration } from './accounting-configuration.js';
import { CreateAccount } from './create-account.js';
import { EntryAllocationFilterBuilder } from './entry-allocations.js';
import { Validity } from './validity.js';

const MONDAY_10_00 = new Date(2022, 1, 1, 10, 0);
const MONDAY_11_00 = new Date(2022, 1, 1, 11, 0);
const TUESDAY_10_00 = new Date(2022, 1, 2, 10, 0);
const WEDNESDAY_10_00 = new Date(2022, 1, 3, 10, 0);
const THURSDAY_10_00 = new Date(2022, 1, 4, 10, 0);
const NEXT_MONTH = new Date(2022, 2, 2, 10, 0);
const NOW = new Date(2022, 1, 4, 12, 50);

function createFacade() { return AccountingConfiguration.inMemory(() => NOW).facade(); }
function createOffBalanceAccount(facade: ReturnType<typeof createFacade>, name: string): AccountId {
    const id = AccountId.generate(); facade.createAccount(CreateAccount.generateOffBalanceAccount(id, name)); return id;
}

describe('TelcoBonusScenarios', () => {
    it('telco bonus should expire and be compensated', () => {
        const facade = createFacade();
        const bonusMinutes = createOffBalanceAccount(facade, "Bonus Minutes - Customer X");
        const expiredBonuses = createOffBalanceAccount(facade, "Expired Bonuses");
        const validUntilWednesday = Validity.until(WEDNESDAY_10_00);

        const bonusGrant = facade.transaction().occurredAt(MONDAY_10_00).appliesAt(MONDAY_10_00).withTypeOf("bonus_grant").executing()
            .creditTo(bonusMinutes, Money.pln(50), validUntilWednesday).build();
        facade.executeSingle(bonusGrant);

        expect(facade.balanceAsOf(bonusMinutes, TUESDAY_10_00)!.equals(Money.pln(50))).toBe(true);

        const bonusEntryId = Array.from(bonusGrant.entries().values()).flat().map(e => e.id())[0];

        const compensation = facade.transaction().occurredAt(THURSDAY_10_00).appliesAt(THURSDAY_10_00)
            .compensatingExpired(bonusEntryId).withCompensationAccount(expiredBonuses).build();

        expect(compensation).not.toBeNull();
        expect(facade.executeSingle(compensation!).isSuccess()).toBe(true);
        expect(facade.balance(bonusMinutes)!.equals(Money.zeroPln())).toBe(true);
        expect(facade.balance(expiredBonuses)!.equals(Money.pln(50))).toBe(true);
    });

    it('partially used bonus should compensate only remaining amount', () => {
        const facade = createFacade();
        const bonusAccount = createOffBalanceAccount(facade, "Bonus Account");
        const expiredBonuses = createOffBalanceAccount(facade, "Expired Bonuses");
        const validUntilWednesday = Validity.until(WEDNESDAY_10_00);

        const bonusGrant = facade.transaction().occurredAt(MONDAY_10_00).appliesAt(MONDAY_10_00).withTypeOf("bonus_grant").executing()
            .creditTo(bonusAccount, Money.pln(100), validUntilWednesday).build();
        facade.executeSingle(bonusGrant);

        const bonusEntryId = Array.from(bonusGrant.entries().values()).flat().map(e => e.id())[0];

        const usage = facade.transaction().occurredAt(TUESDAY_10_00).appliesAt(TUESDAY_10_00).withTypeOf("bonus_usage").executing()
            .debitFrom(bonusAccount, Money.pln(40), bonusEntryId).build();
        facade.executeSingle(usage);
        expect(facade.balance(bonusAccount)!.equals(Money.pln(60))).toBe(true);

        const compensation = facade.transaction().occurredAt(THURSDAY_10_00).appliesAt(THURSDAY_10_00)
            .compensatingExpired(bonusEntryId).withCompensationAccount(expiredBonuses).build();

        expect(compensation).not.toBeNull();
        expect(facade.executeSingle(compensation!).isSuccess()).toBe(true);
        expect(facade.balance(bonusAccount)!.equals(Money.zeroPln())).toBe(true);
        expect(facade.balance(expiredBonuses)!.equals(Money.pln(60))).toBe(true);
    });

    it('multiple bonuses with fifo usage and expiration', () => {
        const facade = createFacade();
        const bonusAccount = createOffBalanceAccount(facade, "Bonus Account");
        const expiredBonuses = createOffBalanceAccount(facade, "Expired Bonuses");
        const shortValidity = Validity.until(WEDNESDAY_10_00);
        const longValidity = Validity.until(NEXT_MONTH);

        const bonus1 = facade.transaction().occurredAt(MONDAY_10_00).appliesAt(MONDAY_10_00).withTypeOf("bonus_grant").executing()
            .creditTo(bonusAccount, Money.pln(30), shortValidity).build();
        const bonus2 = facade.transaction().occurredAt(MONDAY_11_00).appliesAt(MONDAY_11_00).withTypeOf("bonus_grant").executing()
            .creditTo(bonusAccount, Money.pln(70), longValidity).build();
        facade.executeMultiple(bonus1, bonus2);

        const usage = facade.transaction().occurredAt(TUESDAY_10_00).appliesAt(TUESDAY_10_00).withTypeOf("bonus_usage").executing()
            .debitFrom(bonusAccount, Money.pln(20), EntryAllocationFilterBuilder.fifo(bonusAccount).build()).build();
        facade.executeSingle(usage);
        expect(facade.balance(bonusAccount)!.equals(Money.pln(80))).toBe(true);

        const expiringEntryId = Array.from(bonus1.entries().values()).flat().map(e => e.id())[0];

        const compensation = facade.transaction().occurredAt(THURSDAY_10_00).appliesAt(THURSDAY_10_00)
            .compensatingExpired(expiringEntryId).withCompensationAccount(expiredBonuses).build();

        expect(compensation).not.toBeNull();
        expect(facade.executeSingle(compensation!).isSuccess()).toBe(true);
        expect(facade.balance(bonusAccount)!.equals(Money.pln(70))).toBe(true);
        expect(facade.balance(expiredBonuses)!.equals(Money.pln(10))).toBe(true);
    });
});
