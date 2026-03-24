import { PartyRelatedEvent } from './party-related-event.js';
import { PublishedEvent } from './published-event.js';

export interface PartyRegistered extends PartyRelatedEvent, PublishedEvent {
    readonly partyId: string;
}
