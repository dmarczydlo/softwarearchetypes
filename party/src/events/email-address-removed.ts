import { AddressRemovalSucceeded } from './address-removal-succeeded.js';
import { PublishedEvent } from './published-event.js';

export class EmailAddressRemoved implements AddressRemovalSucceeded, PublishedEvent {
    readonly _partyRelatedEvent = true as const;
    readonly _addressRelatedEvent = true as const;
    readonly _addressRemovalSucceeded = true as const;
    readonly _publishedEvent = true as const;

    constructor(
        public readonly addressId: string,
        public readonly partyId: string
    ) {}
}
