import { Address } from './address.js';
import { AddressId } from './address-id.js';
import { PartyId } from './party-id.js';
import { AddressUseType } from './address-use-type.js';
import { AddressDetails } from './address-details.js';
import { PhoneAddressDetails } from './phone-address-details.js';
import { Validity } from './validity.js';
import { PhoneAddressDefined } from './events/phone-address-defined.js';
import { PhoneAddressUpdated } from './events/phone-address-updated.js';
import { PhoneAddressRemoved } from './events/phone-address-removed.js';

export class PhoneAddress extends Address {
    private readonly phoneAddressDetails: PhoneAddressDetails;

    constructor(id: AddressId, partyId: PartyId, phoneAddressDetails: PhoneAddressDetails, useTypes: Set<AddressUseType>, validity?: Validity) {
        super(id, partyId, useTypes, validity);
        this.phoneAddressDetails = phoneAddressDetails;
    }

    addressDetails(): AddressDetails { return this.phoneAddressDetails; }

    toAddressUpdateSucceededEvent(): PhoneAddressUpdated {
        return new PhoneAddressUpdated(this.id().asString(), this.partyId().asString(), this.phoneAddressDetails.phoneNumber, this.useTypesAsStringSet());
    }

    toAddressDefinitionSucceededEvent(): PhoneAddressDefined {
        return new PhoneAddressDefined(this.id().asString(), this.partyId().asString(), this.phoneAddressDetails.phoneNumber, this.useTypesAsStringSet());
    }

    toAddressRemovalSucceededEvent(): PhoneAddressRemoved {
        return new PhoneAddressRemoved(this.id().asString(), this.partyId().asString());
    }

    private useTypesAsStringSet(): Set<string> {
        const result = new Set<string>();
        this.useTypes().forEach(ut => result.add(ut));
        return result;
    }
}
