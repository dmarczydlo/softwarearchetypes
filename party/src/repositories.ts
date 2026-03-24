import { PartyId } from './party-id.js';
import { Party } from './party.js';
import type { RegisteredIdentifier } from './registered-identifier.js';
import { Addresses } from './addresses.js';
import { Address } from './address.js';
import { AddressId } from './address-id.js';
import { Capability } from './capability.js';
import { CapabilityId } from './capability-id.js';
import { CapabilityType } from './capability-type.js';
import { PartyRelationship } from './party-relationship.js';
import { PartyRelationshipId } from './party-relationship-id.js';
import { RelationshipName } from './relationship-name.js';

export interface PartyRepository {
    findBy(partyId: PartyId, partyType?: new (...args: never[]) => Party): Party | null;
    save(party: Party): void;
    delete(partyId: PartyId): void;
    findByIdentifier(registeredIdentifier: RegisteredIdentifier): Party[];
    findMatching(predicate: (party: Party) => boolean): Party[];
}

export interface AddressesRepository {
    findFor(partyId: PartyId): Addresses | null;
    findMatching(partyId: PartyId, predicate: (address: Address) => boolean): Address[];
    save(addresses: Addresses): void;
}

export interface CapabilitiesRepository {
    save(capability: Capability): void;
    remove(id: CapabilityId): void;
    findById(id: CapabilityId): Capability | null;
    findByPartyId(partyId: PartyId): Capability[];
    findByType(type: CapabilityType): Capability[];
    findAll(): Capability[];
}

export interface PartyRelationshipRepository {
    findAllRelationsFrom(partyId: PartyId, name?: RelationshipName): PartyRelationship[];
    findBy(relationshipId: PartyRelationshipId): PartyRelationship | null;
    save(partyRelationship: PartyRelationship): void;
    delete(relationshipId: PartyRelationshipId): PartyRelationshipId | null;
    findMatching(predicate: (relationship: PartyRelationship) => boolean): PartyRelationship[];
}

export class InMemoryPartyRepository implements PartyRepository {
    private readonly map = new Map<string, Party>();

    findBy(partyId: PartyId, partyType?: new (...args: never[]) => Party): Party | null {
        const party = this.map.get(partyId.asString()) ?? null;
        if (party && partyType) {
            return party instanceof partyType ? party : null;
        }
        return party;
    }

    save(party: Party): void { this.map.set(party.id().asString(), party); }
    delete(partyId: PartyId): void { this.map.delete(partyId.asString()); }

    findByIdentifier(registeredIdentifier: RegisteredIdentifier): Party[] {
        return [...this.map.values()].filter(party =>
            [...party.registeredIdentifiers()].some(ri => ri.type() === registeredIdentifier.type() && ri.asString() === registeredIdentifier.asString())
        );
    }

    findMatching(predicate: (party: Party) => boolean): Party[] {
        return [...this.map.values()].filter(predicate);
    }
}

export class InMemoryAddressesRepository implements AddressesRepository {
    private readonly map = new Map<string, Addresses>();

    findFor(partyId: PartyId): Addresses | null {
        return this.map.get(partyId.asString()) ?? null;
    }

    findMatching(partyId: PartyId, predicate: (address: Address) => boolean): Address[] {
        const addresses = this.findFor(partyId);
        if (!addresses) return [];
        return [...addresses.asSet()].filter(predicate);
    }

    save(addresses: Addresses): void { this.map.set(addresses.partyId().asString(), addresses); }
}

export class InMemoryCapabilitiesRepository implements CapabilitiesRepository {
    private readonly capabilities = new Map<string, Capability>();

    save(capability: Capability): void { this.capabilities.set(capability.id.asString(), capability); }
    remove(id: CapabilityId): void { this.capabilities.delete(id.asString()); }
    findById(id: CapabilityId): Capability | null { return this.capabilities.get(id.asString()) ?? null; }
    findByPartyId(partyId: PartyId): Capability[] {
        return [...this.capabilities.values()].filter(c => c.partyId.asString() === partyId.asString());
    }
    findByType(type: CapabilityType): Capability[] {
        return [...this.capabilities.values()].filter(c => c.type.name === type.name);
    }
    findAll(): Capability[] { return [...this.capabilities.values()]; }
}

export class InMemoryPartyRelationshipRepository implements PartyRelationshipRepository {
    private readonly map = new Map<string, PartyRelationship>();

    findAllRelationsFrom(partyId: PartyId, name?: RelationshipName): PartyRelationship[] {
        return [...this.map.values()].filter(rel => {
            if (rel.from.partyId.asString() !== partyId.asString()) return false;
            if (name && rel.name.value !== name.value) return false;
            return true;
        });
    }

    findBy(relationshipId: PartyRelationshipId): PartyRelationship | null {
        return this.map.get(relationshipId.asString()) ?? null;
    }

    save(partyRelationship: PartyRelationship): void {
        this.map.set(partyRelationship.id.asString(), partyRelationship);
    }

    delete(relationshipId: PartyRelationshipId): PartyRelationshipId | null {
        const result = this.map.get(relationshipId.asString());
        if (result) {
            this.map.delete(relationshipId.asString());
            return result.id;
        }
        return null;
    }

    findMatching(predicate: (relationship: PartyRelationship) => boolean): PartyRelationship[] {
        return [...this.map.values()].filter(predicate);
    }
}
