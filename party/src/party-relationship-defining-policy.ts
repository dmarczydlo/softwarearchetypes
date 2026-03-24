import type { PartyRole } from './party-role.js';
import type { RelationshipName } from './relationship-name.js';

export interface PartyRelationshipDefiningPolicy {
    canDefineFor(from: PartyRole, to: PartyRole, relationshipName: RelationshipName): boolean;
}

export class AlwaysAllowPartyRelationshipDefiningPolicy implements PartyRelationshipDefiningPolicy {
    canDefineFor(_from: PartyRole, _to: PartyRole, _relationshipName: RelationshipName): boolean {
        return true;
    }
}

export const PartyRelationshipDefiningPolicies = {
    alwaysAllow(): PartyRelationshipDefiningPolicy {
        return new AlwaysAllowPartyRelationshipDefiningPolicy();
    }
};
