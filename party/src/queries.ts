import { PartyId } from './party-id.js';
import { Party } from './party.js';
import type { RegisteredIdentifier } from './registered-identifier.js';
import type { PartyView, AddressView, PartyRelationshipView } from './views.js';
import { PartyViewMapper, AddressViewMapper, PartyRelationshipViewMapper } from './view-mappers.js';
import type { PartyRepository, AddressesRepository, PartyRelationshipRepository, CapabilitiesRepository } from './repositories.js';
import { PartyRelationshipId } from './party-relationship-id.js';
import { RelationshipName } from './relationship-name.js';
import { Capability } from './capability.js';
import { CapabilityId } from './capability-id.js';
import { CapabilityType } from './capability-type.js';
import type { CapabilityRequirement } from './capability-requirement.js';
import { Address } from './address.js';
import type { PartyRelationship } from './party-relationship.js';
import { LocationScope, SkillLevelScope } from './operating-scope.js';

export class PartiesQueries {
    private readonly partyRepository: PartyRepository;
    constructor(partyRepository: PartyRepository) { this.partyRepository = partyRepository; }

    findBy(partyId: PartyId): PartyView | null {
        const party = this.partyRepository.findBy(partyId);
        return party ? PartyViewMapper.toView(party) : null;
    }

    findOneBy(registeredIdentifier: RegisteredIdentifier): PartyView | null {
        const partiesMatching = this.partyRepository.findByIdentifier(registeredIdentifier);
        if (partiesMatching.length > 1) {
            throw new Error(`There are more than one parties with the same registered identifier of ${registeredIdentifier}`);
        }
        return partiesMatching.length > 0 ? PartyViewMapper.toView(partiesMatching[0]) : null;
    }

    findMatching(predicate: (party: Party) => boolean): PartyView[] {
        return this.partyRepository.findMatching(predicate).map(PartyViewMapper.toView);
    }
}

export class AddressesQueries {
    private readonly repository: AddressesRepository;
    constructor(repository: AddressesRepository) { this.repository = repository; }

    findAllFor(partyId: PartyId): AddressView[] {
        const addresses = this.repository.findFor(partyId);
        if (!addresses) return [];
        return [...addresses.asSet()].map(AddressViewMapper.toView);
    }

    findMatching(partyId: PartyId, predicate: (address: Address) => boolean): AddressView[] {
        const addresses = this.repository.findFor(partyId);
        if (!addresses) return [];
        return [...addresses.asSet()].filter(predicate).map(AddressViewMapper.toView);
    }
}

export class PartyRelationshipsQueries {
    private readonly repository: PartyRelationshipRepository;
    constructor(repository: PartyRelationshipRepository) { this.repository = repository; }

    findBy(partyRelationshipId: PartyRelationshipId): PartyRelationshipView | null {
        const rel = this.repository.findBy(partyRelationshipId);
        return rel ? PartyRelationshipViewMapper.toView(rel) : null;
    }

    findAllRelationsFrom(partyId: PartyId, relationshipName?: string): PartyRelationshipView[] {
        const name = relationshipName ? RelationshipName.of(relationshipName) : undefined;
        return this.repository.findAllRelationsFrom(partyId, name).map(PartyRelationshipViewMapper.toView);
    }

    findMatching(predicate: (rel: PartyRelationship) => boolean): PartyRelationshipView[] {
        return this.repository.findMatching(predicate).map(PartyRelationshipViewMapper.toView);
    }
}

export class CapabilitiesQueries {
    private readonly repository: CapabilitiesRepository;
    constructor(repository: CapabilitiesRepository) { this.repository = repository; }

    findByPartyId(partyId: PartyId): Capability[] {
        return this.repository.findByPartyId(partyId).filter(c => c.isCurrentlyValid());
    }
    findByType(type: CapabilityType | string): Capability[] {
        const capType = typeof type === 'string' ? CapabilityType.of(type) : type;
        return this.repository.findByType(capType).filter(c => c.isCurrentlyValid());
    }
    findById(id: CapabilityId): Capability | null { return this.repository.findById(id); }

    findPartiesWithCapability(type: CapabilityType): PartyId[] {
        return [...new Set(this.repository.findByType(type).filter(c => c.isCurrentlyValid()).map(c => c.partyId.asString()))]
            .map(id => PartyId.of(id));
    }

    findPartiesSatisfying(requirement: CapabilityRequirement): PartyId[] {
        return [...new Set(this.repository.findByType(requirement.requiredType)
            .filter(c => c.isCurrentlyValid())
            .filter(c => c.satisfies(requirement))
            .map(c => c.partyId.asString())
        )].map(id => PartyId.of(id));
    }

    findPartiesAtLocation(type: CapabilityType, location: string): PartyId[] {
        return [...new Set(this.repository.findByType(type)
            .filter(c => c.isCurrentlyValid())
            .filter(c => { const s = c.scope(LocationScope); return s ? s.includes(location) : false; })
            .map(c => c.partyId.asString())
        )].map(id => PartyId.of(id));
    }

    findPartiesWithSkillLevel(type: CapabilityType, minLevel: SkillLevelScope): PartyId[] {
        return [...new Set(this.repository.findByType(type)
            .filter(c => c.isCurrentlyValid())
            .filter(c => { const s = c.scope(SkillLevelScope); return s ? s.isAtLeast(minLevel) : false; })
            .map(c => c.partyId.asString())
        )].map(id => PartyId.of(id));
    }
}
