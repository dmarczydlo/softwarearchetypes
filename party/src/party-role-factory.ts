import { ResultFactory, type Result } from '@softwarearchetypes/common';
import { Party } from './party.js';
import { Role } from './role.js';
import { PartyRole } from './party-role.js';
import type { PartyRoleDefiningPolicy } from './party-role-defining-policy.js';
import { AlwaysAllowPartyRoleDefiningPolicy } from './party-role-defining-policy.js';

export class PartyRoleFactory {
    private readonly policy: PartyRoleDefiningPolicy;

    constructor(policy?: PartyRoleDefiningPolicy) {
        this.policy = policy ?? new AlwaysAllowPartyRoleDefiningPolicy();
    }

    defineFor(party: Party, role: Role): Result<string, PartyRole> {
        if (this.policy.canDefineFor(party, role)) {
            return ResultFactory.success(PartyRole.of(party.id(), role));
        } else {
            return ResultFactory.failure('Policies for assigning party role not met');
        }
    }
}
