import { AccountId } from './account-id.js';
import { AccountingFacade } from './accounting-facade.js';
import { CreateAccount } from './create-account.js';

export class AccountFixture {
    private readonly facade: AccountingFacade;

    private constructor(facade: AccountingFacade) {
        this.facade = facade;
    }

    static accountingFixtureFor(facade: AccountingFacade): AccountFixture {
        return new AccountFixture(facade);
    }

    createAssetAccount(name: string): AccountId {
        const id = AccountId.generate();
        this.facade.createAccount(CreateAccount.generateAssetAccount(id, name));
        return id;
    }

    createOffBalanceAccount(name: string): AccountId {
        const id = AccountId.generate();
        this.facade.createAccount(CreateAccount.generateOffBalanceAccount(id, name));
        return id;
    }
}
