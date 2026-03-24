import { Version } from '@softwarearchetypes/common';
import { AccountId } from './account-id.js';
import { Filter } from './filter.js';

export class ProjectionAccount {
    private readonly accountId: AccountId;
    private readonly _filter: Filter;
    private readonly _name: string;
    private readonly _version: Version;

    constructor(accountId: AccountId, filter: Filter, name: string, version?: Version) {
        this.accountId = accountId;
        this._filter = filter;
        this._name = name;
        this._version = version ?? Version.initial();
    }

    desc(): string {
        return this._name;
    }

    id(): AccountId {
        return this.accountId;
    }

    filter(): Filter {
        return this._filter;
    }

    version(): Version {
        return this._version;
    }
}
