import { AddressId } from './address-id.js';
import { PartyId } from './party-id.js';
import { AddressUseType } from './address-use-type.js';
import { AddressDetails } from './address-details.js';
import { Validity } from './validity.js';
import { AddressDefinitionSucceeded } from './events/address-definition-succeeded.js';
import { AddressUpdateSucceeded } from './events/address-update-succeeded.js';
import { AddressRemovalSucceeded } from './events/address-removal-succeeded.js';

export abstract class Address {
    private readonly _id: AddressId;
    private readonly _partyId: PartyId;
    private readonly _useTypes: Set<AddressUseType>;
    private readonly _validity: Validity;

    protected constructor(id: AddressId, partyId: PartyId, useTypes: Set<AddressUseType>, validity: Validity = Validity.ALWAYS) {
        this._id = id;
        this._partyId = partyId;
        this._useTypes = new Set(useTypes ?? []);
        this._validity = validity;
    }

    id(): AddressId { return this._id; }
    partyId(): PartyId { return this._partyId; }
    useTypes(): Set<AddressUseType> { return new Set(this._useTypes); }
    abstract addressDetails(): AddressDetails;
    validity(): Validity { return this._validity; }
    isCurrentlyValid(): boolean { return this._validity.isCurrentlyValid(); }
    isValidAt(instant: Date): boolean { return this._validity.isValidAt(instant); }

    differsFrom(newAddress: Address): boolean {
        return !this.detailsEqual(this.addressDetails(), newAddress.addressDetails());
    }

    private detailsEqual(a: AddressDetails, b: AddressDetails): boolean {
        return JSON.stringify(a) === JSON.stringify(b);
    }

    abstract toAddressUpdateSucceededEvent(): AddressUpdateSucceeded;
    abstract toAddressDefinitionSucceededEvent(): AddressDefinitionSucceeded;
    abstract toAddressRemovalSucceededEvent(): AddressRemovalSucceeded;
}
