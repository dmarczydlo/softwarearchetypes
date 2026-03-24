import { Version } from '@softwarearchetypes/common';
import { Organization } from './organization.js';
import { PartyId } from './party-id.js';
import { Role } from './role.js';
import type { RegisteredIdentifier } from './registered-identifier.js';
import { OrganizationName } from './organization-name.js';
import type { PartyRegistered } from './events/party-registered.js';
import { OrganizationUnitRegistered } from './events/organization-unit-registered.js';

export class OrganizationUnit extends Organization {
    constructor(partyId: PartyId, organizationName: OrganizationName, roles: Set<Role>,
                registeredIdentifiers: Set<RegisteredIdentifier>, version: Version) {
        super('ORGANIZATION_UNIT', partyId, organizationName, roles, registeredIdentifiers, version);
    }

    toPartyRegisteredEvent(): PartyRegistered {
        return new OrganizationUnitRegistered(
            this.id().asString(), this.organizationName().value,
            new Set([...this.registeredIdentifiers()].map(ri => ri.asString())),
            new Set([...this.roles()].map(r => r.asString()))
        );
    }
}
