import type { Role } from './role.js';

export interface PartyRoleDefiningPolicy {
    canDefineFor(party: { readonly _partyType: string }, role: Role): boolean;
}

export class AlwaysAllowPartyRoleDefiningPolicy implements PartyRoleDefiningPolicy {
    canDefineFor(_party: { readonly _partyType: string }, _role: Role): boolean {
        return true;
    }
}

export const PartyRoleDefiningPolicies = {
    alwaysAllow(): PartyRoleDefiningPolicy {
        return new AlwaysAllowPartyRoleDefiningPolicy();
    }
};
