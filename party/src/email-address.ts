import { Address } from './address.js';
import { AddressId } from './address-id.js';
import { PartyId } from './party-id.js';
import { AddressUseType } from './address-use-type.js';
import { AddressDetails } from './address-details.js';
import { EmailAddressDetails } from './email-address-details.js';
import { Validity } from './validity.js';
import { EmailAddressDefined } from './events/email-address-defined.js';
import { EmailAddressUpdated } from './events/email-address-updated.js';
import { EmailAddressRemoved } from './events/email-address-removed.js';

export class EmailAddress extends Address {
    private readonly emailAddressDetails: EmailAddressDetails;

    constructor(id: AddressId, partyId: PartyId, emailAddressDetails: EmailAddressDetails, useTypes: Set<AddressUseType>, validity?: Validity) {
        super(id, partyId, useTypes, validity);
        this.emailAddressDetails = emailAddressDetails;
    }

    addressDetails(): AddressDetails { return this.emailAddressDetails; }

    toAddressUpdateSucceededEvent(): EmailAddressUpdated {
        return new EmailAddressUpdated(this.id().asString(), this.partyId().asString(), this.emailAddressDetails.email, this.useTypesAsStringSet());
    }

    toAddressDefinitionSucceededEvent(): EmailAddressDefined {
        return new EmailAddressDefined(this.id().asString(), this.partyId().asString(), this.emailAddressDetails.email, this.useTypesAsStringSet());
    }

    toAddressRemovalSucceededEvent(): EmailAddressRemoved {
        return new EmailAddressRemoved(this.id().asString(), this.partyId().asString());
    }

    private useTypesAsStringSet(): Set<string> {
        const result = new Set<string>();
        this.useTypes().forEach(ut => result.add(ut));
        return result;
    }
}
