import { Preconditions } from '@softwarearchetypes/common';
import { PartyId } from './party-id.js';
import { Role } from './role.js';

export class PartyRole {
    readonly partyId: PartyId;
    readonly role: Role;

    constructor(partyId: PartyId, role: Role) {
        Preconditions.checkArgument(partyId != null, 'PartyId cannot be null');
        Preconditions.checkArgument(role != null, 'Role cannot be null');
        this.partyId = partyId;
        this.role = role;
    }

    static of(partyId: PartyId, roleOrString: Role | string): PartyRole {
        const role = typeof roleOrString === 'string' ? Role.of(roleOrString) : roleOrString;
        return new PartyRole(partyId, role);
    }
}
