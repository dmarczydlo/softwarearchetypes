import { AddressRelatedEvent } from './address-related-event.js';

export interface AddressRemovalSucceeded extends AddressRelatedEvent {
    readonly _addressRemovalSucceeded: true;
}
