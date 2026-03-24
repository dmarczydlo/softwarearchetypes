import { PartyRelationshipId } from './party-relationship-id.js';
import { PartyRole } from './party-role.js';
import { RelationshipName } from './relationship-name.js';
import { Validity } from './validity.js';
import { PartyRelationshipAdded } from './events/party-relationship-added.js';

export class PartyRelationship {
    readonly id: PartyRelationshipId;
    readonly from: PartyRole;
    readonly to: PartyRole;
    readonly name: RelationshipName;
    readonly validity: Validity;

    constructor(id: PartyRelationshipId, from: PartyRole, to: PartyRole, name: RelationshipName, validity: Validity = Validity.ALWAYS) {
        this.id = id;
        this.from = from;
        this.to = to;
        this.name = name;
        this.validity = validity;
    }

    static create(id: PartyRelationshipId, from: PartyRole, to: PartyRole, name: RelationshipName, validity: Validity = Validity.ALWAYS): PartyRelationship {
        return new PartyRelationship(id, from, to, name, validity);
    }

    toPartyRelationshipAddedEvent(): PartyRelationshipAdded {
        return new PartyRelationshipAdded(
            this.id.asString(), this.from.partyId.asString(),
            this.from.role.asString(), this.to.partyId.asString(),
            this.to.role.asString(), this.name.asString()
        );
    }
}
