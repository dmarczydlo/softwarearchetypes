import { ResultFactory, type Result } from '@softwarearchetypes/common';
import { PartyRole } from './party-role.js';
import { RelationshipName } from './relationship-name.js';
import { PartyRelationship } from './party-relationship.js';
import { PartyRelationshipId } from './party-relationship-id.js';
import type { PartyRelationshipDefiningPolicy } from './party-relationship-defining-policy.js';
import { AlwaysAllowPartyRelationshipDefiningPolicy } from './party-relationship-defining-policy.js';

export class PartyRelationshipFactory {
    private readonly policy: PartyRelationshipDefiningPolicy;
    private readonly partyRelationshipIdSupplier: () => PartyRelationshipId;

    constructor(policy: PartyRelationshipDefiningPolicy | null, partyRelationshipIdSupplier: () => PartyRelationshipId) {
        this.policy = policy ?? new AlwaysAllowPartyRelationshipDefiningPolicy();
        this.partyRelationshipIdSupplier = partyRelationshipIdSupplier ?? (() => PartyRelationshipId.random());
    }

    defineFor(from: PartyRole, to: PartyRole, name: RelationshipName): Result<string, PartyRelationship> {
        if (this.policy.canDefineFor(from, to, name)) {
            return ResultFactory.success(PartyRelationship.create(this.partyRelationshipIdSupplier(), from, to, name));
        } else {
            return ResultFactory.failure('Policies for defining party relationship not met');
        }
    }
}
