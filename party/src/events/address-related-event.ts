import { PartyRelatedEvent } from './party-related-event.js';

export interface AddressRelatedEvent extends PartyRelatedEvent {
    readonly _addressRelatedEvent: true;
}
