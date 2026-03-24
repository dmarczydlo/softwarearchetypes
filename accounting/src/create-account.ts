import { AccountId } from './account-id.js';

export class CreateAccount {
    readonly accountId: AccountId;
    readonly name: string;
    readonly type: string;

    constructor(accountId: AccountId, name: string, type: string) {
        this.accountId = accountId;
        this.name = name;
        this.type = type;
    }

    static generateAssetAccount(accountIdOrName: AccountId | string, name?: string): CreateAccount {
        if (accountIdOrName instanceof AccountId) {
            return new CreateAccount(accountIdOrName, name ?? "", "ASSET");
        }
        return new CreateAccount(AccountId.generate(), accountIdOrName, "ASSET");
    }

    static generateOffBalanceAccount(accountIdOrName: AccountId | string, name?: string): CreateAccount {
        if (accountIdOrName instanceof AccountId) {
            return new CreateAccount(accountIdOrName, name ?? "", "OFF_BALANCE");
        }
        return new CreateAccount(AccountId.generate(), accountIdOrName, "OFF_BALANCE");
    }

    static generate(typeOrName: string, type?: string): CreateAccount {
        if (type !== undefined) {
            return new CreateAccount(AccountId.generate(), typeOrName, type);
        }
        return new CreateAccount(AccountId.generate(), "", typeOrName);
    }
}
