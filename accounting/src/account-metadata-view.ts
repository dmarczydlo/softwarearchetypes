import { AccountId } from './account-id.js';

export class AccountMetadataView {
    readonly id: AccountId;
    readonly name: string;
    readonly type: string | null;

    constructor(id: AccountId, name: string, type: string | null) {
        this.id = id;
        this.name = name;
        this.type = type;
    }
}
