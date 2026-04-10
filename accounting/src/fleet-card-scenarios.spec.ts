import { describe, it, expect } from 'vitest';
import { Money } from '@softwarearchetypes/quantity';
import { AccountId } from './account-id.js';
import { AccountingConfiguration } from './accounting-configuration.js';
import { CreateAccount } from './create-account.js';
import { Entry } from './entry.js';
import { Validity } from './validity.js';

const MONDAY_10_00 = new Date(2022, 1, 1, 10, 0);
const TUESDAY_10_00 = new Date(2022, 1, 2, 10, 0);
const WEDNESDAY_10_00 = new Date(2022, 1, 3, 10, 0);
const THURSDAY_10_00 = new Date(2022, 1, 4, 10, 0);
const NEXT_MONTH = new Date(2022, 2, 2, 10, 0);
const NOW = new Date(2022, 1, 4, 12, 50);

function createFacade() { return AccountingConfiguration.inMemory(() => NOW).facade(); }
function createOffBalanceAccount(facade: ReturnType<typeof createFacade>, name: string): AccountId {
    const id = AccountId.generate(); facade.createAccount(CreateAccount.generateOffBalanceAccount(id, name)); return id;
}

describe('FleetCardScenarios', () => {
    it('fleet card limit should have validity period', () => {
        const facade = createFacade();
        const fleetCardLimit = createOffBalanceAccount(facade, "Fleet Card Limit - ABC123");
        const validUntilEndOfMonth = Validity.until(NEXT_MONTH);

        const limitGrant = facade.transaction().occurredAt(MONDAY_10_00).appliesAt(MONDAY_10_00).withTypeOf("limit_grant").executing()
            .creditTo(fleetCardLimit, Money.pln(5000), validUntilEndOfMonth).build();
        facade.executeSingle(limitGrant);

        const usage = facade.transaction().occurredAt(TUESDAY_10_00).appliesAt(TUESDAY_10_00).withTypeOf("fuel_purchase").executing()
            .debitFrom(fleetCardLimit, Money.pln(200)).build();
        const result = facade.executeSingle(usage);

        expect(result.success()).toBe(true);
        expect(facade.balance(fleetCardLimit)!.equals(Money.pln(4800))).toBe(true);
    });

    it('expired limit should be compensated', () => {
        const facade = createFacade();
        const fleetCardLimit = createOffBalanceAccount(facade, "Fleet Card Limit");
        const expiredLimitsAccount = createOffBalanceAccount(facade, "Expired Limits");
        const validUntilWednesday = Validity.until(WEDNESDAY_10_00);

        const limitGrant = facade.transaction().occurredAt(MONDAY_10_00).appliesAt(MONDAY_10_00).withTypeOf("limit_grant").executing()
            .creditTo(fleetCardLimit, Money.pln(1000), validUntilWednesday).build();
        facade.executeSingle(limitGrant);

        const limitEntryId = Array.from(limitGrant.entries().values()).flat().map(e => e.id())[0];

        const compensation = facade.transaction().occurredAt(THURSDAY_10_00).appliesAt(THURSDAY_10_00)
            .compensatingExpired(limitEntryId).withCompensationAccount(expiredLimitsAccount).build();

        expect(compensation).not.toBeNull();
        expect(facade.executeSingle(compensation!).success()).toBe(true);
        expect(facade.balance(fleetCardLimit)!.equals(Money.pln(0))).toBe(true);
        expect(facade.balance(expiredLimitsAccount)!.equals(Money.pln(1000))).toBe(true);
    });

    it('multiple limits with different validity and expiration compensation', () => {
        const facade = createFacade();
        const fleetCardLimit = createOffBalanceAccount(facade, "Fleet Card Limit");
        const expiredLimitsAccount = createOffBalanceAccount(facade, "Expired Limits");
        const validUntilWednesday = Validity.until(WEDNESDAY_10_00);
        const validUntilNextMonth = Validity.until(NEXT_MONTH);

        const limit1 = facade.transaction().occurredAt(MONDAY_10_00).appliesAt(MONDAY_10_00).withTypeOf("limit_grant").executing()
            .creditTo(fleetCardLimit, Money.pln(1000), validUntilWednesday).build();
        const limit2 = facade.transaction().occurredAt(MONDAY_10_00).appliesAt(MONDAY_10_00).withTypeOf("limit_grant").executing()
            .creditTo(fleetCardLimit, Money.pln(2000), validUntilNextMonth).build();

        facade.executeMultiple(limit1, limit2);
        expect(facade.balance(fleetCardLimit)!.equals(Money.pln(3000))).toBe(true);

        const expiringEntryId = Array.from(limit1.entries().values()).flat().map(e => e.id())[0];

        const compensation = facade.transaction().occurredAt(THURSDAY_10_00).appliesAt(THURSDAY_10_00)
            .compensatingExpired(expiringEntryId).withCompensationAccount(expiredLimitsAccount).build();

        expect(compensation).not.toBeNull();
        expect(facade.executeSingle(compensation!).success()).toBe(true);
        expect(facade.balance(fleetCardLimit)!.equals(Money.pln(2000))).toBe(true);
        expect(facade.balance(expiredLimitsAccount)!.equals(Money.pln(1000))).toBe(true);
    });
});
