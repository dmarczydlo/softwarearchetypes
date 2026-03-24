import { Address } from './address.js';
import { AddressId } from './address-id.js';
import { PartyId } from './party-id.js';
import { AddressUseType } from './address-use-type.js';
import { AddressDetails } from './address-details.js';
import { WebAddressDetails } from './web-address-details.js';
import { Validity } from './validity.js';
import { WebAddressDefined } from './events/web-address-defined.js';
import { WebAddressUpdated } from './events/web-address-updated.js';
import { WebAddressRemoved } from './events/web-address-removed.js';

export class WebAddress extends Address {
    private readonly webAddressDetails: WebAddressDetails;

    constructor(id: AddressId, partyId: PartyId, webAddressDetails: WebAddressDetails, useTypes: Set<AddressUseType>, validity?: Validity) {
        super(id, partyId, useTypes, validity);
        this.webAddressDetails = webAddressDetails;
    }

    addressDetails(): AddressDetails { return this.webAddressDetails; }

    toAddressUpdateSucceededEvent(): WebAddressUpdated {
        return new WebAddressUpdated(this.id().asString(), this.partyId().asString(), this.webAddressDetails.url, this.useTypesAsStringSet());
    }

    toAddressDefinitionSucceededEvent(): WebAddressDefined {
        return new WebAddressDefined(this.id().asString(), this.partyId().asString(), this.webAddressDetails.url, this.useTypesAsStringSet());
    }

    toAddressRemovalSucceededEvent(): WebAddressRemoved {
        return new WebAddressRemoved(this.id().asString(), this.partyId().asString());
    }

    private useTypesAsStringSet(): Set<string> {
        const result = new Set<string>();
        this.useTypes().forEach(ut => result.add(ut));
        return result;
    }
}
