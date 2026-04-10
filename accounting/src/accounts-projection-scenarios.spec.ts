import { describe, it, expect } from 'vitest';
import { Money } from '@softwarearchetypes/quantity';
import { AccountId } from './account-id.js';
import { AccountingConfiguration } from './accounting-configuration.js';
import { CreateAccount } from './create-account.js';
import { Filter } from './filter.js';
import { MetaData } from './metadata.js';
import { EntryFilter } from './account-entry-filter.js';
import { randomStringWithPrefixOf } from './random-fixture.js';

const NOW = new Date(2022, 1, 2, 12, 50);
function createFacade() {
    return AccountingConfiguration.inMemory(() => NOW).facade();
}

describe('AccountsProjectionScenarios', () => {
    it('can create projecting account', () => {
        const facade = createFacade();
        const cash = AccountId.generate();
        const projected = AccountId.generate();
        const projecting = AccountId.generate();

        expect(facade.createAccount(CreateAccount.generateAssetAccount(cash, randomStringWithPrefixOf("cash"))).success()).toBe(true);
        expect(facade.createAccount(CreateAccount.generateAssetAccount(projected, randomStringWithPrefixOf("projected"))).success()).toBe(true);

        const entryPredicate = (entry: import('./entry.js').Entry) => {
            return EntryFilter.ENTRY_OF_ACCOUNT(projected)(entry) &&
                   EntryFilter.ENTRY_HAVING_METADATA(EntryFilter.HAVING_VALUES("initiator", "ewa"))(entry);
        };

        const projectingResult = facade.createProjectingAccountWithFilter(projecting, Filter.just(entryPredicate), "ewa-opis");
        expect(projectingResult.success()).toBe(true);

        facade.transfer(projected, cash, Money.pln(40), NOW, NOW, new MetaData(new Map([["initiator", "ewa"]])));
        facade.transfer(projected, cash, Money.pln(10), NOW, NOW);
        facade.transfer(projected, cash, Money.pln(30), NOW, NOW, new MetaData(new Map([["initiator", "jacek"]])));

        expect(facade.balance(projected)!.equals(Money.pln(-80))).toBe(true);
        expect(facade.balance(projecting)!.equals(Money.pln(-40))).toBe(true);

        const projectedView = facade.findAccount(projected);
        const projectingView = facade.findAccount(projecting);
        expect(projectedView).not.toBeNull();
        expect(projectingView).not.toBeNull();
        expect(projectedView!.entries).toHaveLength(3);
        expect(projectingView!.entries).toHaveLength(1);
        expect(projectingView!.name).toBe("ewa-opis");
    });

    it('projecting accounts do not have type', () => {
        const facade = createFacade();
        const projected = AccountId.generate();
        const projecting = AccountId.generate();
        facade.createAccount(CreateAccount.generateAssetAccount(projected, randomStringWithPrefixOf("acc")));

        const entryPredicate = (entry: import('./entry.js').Entry) => {
            return EntryFilter.ENTRY_OF_ACCOUNT(projected)(entry) &&
                   EntryFilter.ENTRY_HAVING_METADATA(EntryFilter.HAVING_VALUES("initiator", "ewa"))(entry);
        };

        const result = facade.createProjectingAccountWithFilter(projecting, Filter.just(entryPredicate), "ewa-opis");
        expect(result.success()).toBe(true);

        const projectedView = facade.findAccount(projected);
        const projectingView = facade.findAccount(projecting);
        expect(projectedView!.type).toBe("ASSET");
        expect(projectingView!.type).toBeNull();
    });
});
