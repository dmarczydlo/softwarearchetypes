import { PartyRelatedEvent } from './party-related-event.js';
import { PublishedEvent } from './published-event.js';

export class PartyRelationshipRemoved implements PartyRelatedEvent, PublishedEvent {
    readonly _partyRelatedEvent = true as const;
    readonly _publishedEvent = true as const;

    constructor(
        public readonly partyRelationshipId: string
    ) {}
}
