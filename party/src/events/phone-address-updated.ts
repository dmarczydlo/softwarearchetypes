import { AddressUpdateSucceeded } from './address-update-succeeded.js';
import { PublishedEvent } from './published-event.js';

export class PhoneAddressUpdated implements AddressUpdateSucceeded, PublishedEvent {
    readonly _partyRelatedEvent = true as const;
    readonly _addressRelatedEvent = true as const;
    readonly _addressUpdateSucceeded = true as const;
    readonly _publishedEvent = true as const;

    constructor(
        public readonly addressId: string,
        public readonly partyId: string,
        public readonly phoneNumber: string,
        public readonly useTypes: Set<string>
    ) {}
}
