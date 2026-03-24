import { AddressDefinitionSucceeded } from './address-definition-succeeded.js';
import { PublishedEvent } from './published-event.js';

export class GeoAddressDefined implements AddressDefinitionSucceeded, PublishedEvent {
    readonly _partyRelatedEvent = true as const;
    readonly _addressRelatedEvent = true as const;
    readonly _addressDefinitionSucceeded = true as const;
    readonly _publishedEvent = true as const;

    constructor(
        public readonly addressId: string,
        public readonly partyId: string,
        public readonly name: string,
        public readonly street: string,
        public readonly building: string,
        public readonly flat: string,
        public readonly city: string,
        public readonly zip: string,
        public readonly locale: string,
        public readonly useTypes: Set<string>
    ) {}
}
