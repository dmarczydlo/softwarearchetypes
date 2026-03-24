import { AddressRelatedEvent } from './address-related-event.js';

export interface AddressDefinitionSucceeded extends AddressRelatedEvent {
    readonly _addressDefinitionSucceeded: true;
}
