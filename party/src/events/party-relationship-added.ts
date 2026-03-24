import { PartyRelatedEvent } from './party-related-event.js';
import { PublishedEvent } from './published-event.js';

export class PartyRelationshipAdded implements PartyRelatedEvent, PublishedEvent {
    readonly _partyRelatedEvent = true as const;
    readonly _publishedEvent = true as const;

    constructor(
        public readonly partyRelationshipId: string,
        public readonly fromPartyId: string,
        public readonly fromPartyRole: string,
        public readonly toPartyId: string,
        public readonly toPartyRole: string,
        public readonly relationshipName: string
    ) {}
}
