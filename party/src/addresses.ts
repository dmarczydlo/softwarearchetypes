import { ResultFactory, type Result } from '@softwarearchetypes/common';
import { Version } from '@softwarearchetypes/common';
import { PartyId } from './party-id.js';
import { AddressId } from './address-id.js';
import { Address } from './address.js';
import type { AddressRelatedEvent } from './events/address-related-event.js';
import type { PublishedEvent } from './events/published-event.js';
import { AddressRemovalSkipped } from './events/address-removal-skipped.js';
import { AddressUpdateSkipped } from './events/address-update-skipped.js';
import type { AddressDefiningPolicy } from './address-defining-policy.js';
import { AddressDefiningPolicies } from './address-defining-policy.js';

export class Addresses {
    private readonly _partyId: PartyId;
    private readonly _addresses: Map<string, Address>;
    private readonly _events: AddressRelatedEvent[] = [];
    private readonly _version: Version;
    private readonly _addressDefiningPolicy: AddressDefiningPolicy;

    private constructor(partyId: PartyId, addresses: Set<Address>, version: Version, addressDefiningPolicy: AddressDefiningPolicy) {
        this._partyId = partyId;
        this._addresses = new Map();
        for (const addr of addresses) {
            this._addresses.set(addr.id().asString(), addr);
        }
        this._version = version;
        this._addressDefiningPolicy = addressDefiningPolicy;
    }

    static emptyAddressesFor(partyId: PartyId, addressDefiningPolicy?: AddressDefiningPolicy): Addresses {
        return new Addresses(partyId, new Set(), Version.initial(), addressDefiningPolicy ?? AddressDefiningPolicies.DEFAULT);
    }

    partyId(): PartyId { return this._partyId; }
    version(): Version { return this._version; }
    events(): AddressRelatedEvent[] { return [...this._events]; }

    asSet(): Set<Address> {
        return new Set(this._addresses.values());
    }

    addOrUpdate(address: Address): Result<string, Addresses> {
        const existing = this._addresses.get(address.id().asString());
        if (existing) {
            return this.updateWithDataFrom(existing, address);
        } else if (this._addressDefiningPolicy.isAddressDefinitionAllowedFor(this, address)) {
            this._addresses.set(address.id().asString(), address);
            this._events.push(address.toAddressDefinitionSucceededEvent());
            return ResultFactory.success(this);
        } else {
            return ResultFactory.failure('POLICY_NOT_MET');
        }
    }

    removeAddressWith(addressId: AddressId): Result<string, Addresses> {
        const address = this._addresses.get(addressId.asString());
        if (address) {
            this._addresses.delete(addressId.asString());
            this._events.push(address.toAddressRemovalSucceededEvent());
        } else {
            this._events.push(AddressRemovalSkipped.dueToAddressNotFoundFor(addressId.asString(), this._partyId.asString()));
        }
        return ResultFactory.success(this);
    }

    private updateWithDataFrom(addressToBeUpdated: Address, newAddress: Address): Result<string, Addresses> {
        if (addressToBeUpdated.constructor === newAddress.constructor) {
            if (addressToBeUpdated.differsFrom(newAddress)) {
                this._addresses.set(newAddress.id().asString(), newAddress);
                this._events.push(newAddress.toAddressUpdateSucceededEvent());
            } else {
                this._events.push(AddressUpdateSkipped.dueToNoChangesIdentifiedFor(addressToBeUpdated.id().asString(), this._partyId.asString()));
            }
            return ResultFactory.success(this);
        } else {
            return ResultFactory.failure('NOT_MATCHING_ADDRESS_TYPE');
        }
    }

    publishedEvents(): PublishedEvent[] {
        return this._events.filter((e): e is AddressRelatedEvent & PublishedEvent => '_publishedEvent' in e);
    }
}
