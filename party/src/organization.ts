import { ResultFactory, type Result } from '@softwarearchetypes/common';
import { Version } from '@softwarearchetypes/common';
import { Party } from './party.js';
import { PartyId } from './party-id.js';
import { Role } from './role.js';
import type { RegisteredIdentifier } from './registered-identifier.js';
import { OrganizationName } from './organization-name.js';
import { OrganizationNameUpdated } from './events/organization-name-updated.js';
import { OrganizationNameUpdateSkipped } from './events/organization-name-update-skipped.js';

export abstract class Organization extends Party {
    private _organizationName: OrganizationName;

    protected constructor(partyType: string, partyId: PartyId, organizationName: OrganizationName, roles: Set<Role>,
                          registeredIdentifiers: Set<RegisteredIdentifier>, version: Version) {
        super(partyType, partyId, roles, registeredIdentifiers, version);
        this._organizationName = organizationName;
    }

    updateName(organizationName: OrganizationName): Result<string, Organization> {
        if (this._organizationName.value !== organizationName.value) {
            this._organizationName = organizationName;
            this.register(new OrganizationNameUpdated(this.id().asString(), organizationName.value));
        } else {
            this.register(OrganizationNameUpdateSkipped.dueToNoChangeIdentifiedFor(this.id().asString(), organizationName.value));
        }
        return ResultFactory.success(this);
    }

    organizationName(): OrganizationName { return this._organizationName; }
}
