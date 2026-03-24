import { PartyId } from './party-id.js';
import { PartySnapshot } from './party-snapshot.js';
import { RoleInOrder } from './role-in-order.js';

export class PartyInOrder {
    readonly party: PartySnapshot;
    readonly roles: Set<RoleInOrder>;

    constructor(party: PartySnapshot, roles: Set<RoleInOrder>) {
        if (party == null) {
            throw new Error("Party cannot be null");
        }
        if (roles == null || roles.size === 0) {
            throw new Error("At least one role must be specified");
        }
        this.party = party;
        this.roles = new Set(roles);
    }

    static of(party: PartySnapshot, ...roles: RoleInOrder[]): PartyInOrder {
        return new PartyInOrder(party, new Set(roles));
    }

    static ofSet(party: PartySnapshot, roles: Set<RoleInOrder>): PartyInOrder {
        return new PartyInOrder(party, roles);
    }

    hasRole(role: RoleInOrder): boolean {
        return this.roles.has(role);
    }

    partyId(): PartyId {
        return this.party.partyId;
    }
}
