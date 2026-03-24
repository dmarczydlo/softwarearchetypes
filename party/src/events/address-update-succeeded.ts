import { AddressRelatedEvent } from './address-related-event.js';

export interface AddressUpdateSucceeded extends AddressRelatedEvent {
    readonly _addressUpdateSucceeded: true;
}
