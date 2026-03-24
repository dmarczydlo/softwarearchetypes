import { PartyRelatedEvent } from './party-related-event.js';
import { PublishedEvent } from './published-event.js';

export class RegisteredIdentifierAdded implements PartyRelatedEvent, PublishedEvent {
    readonly _partyRelatedEvent = true as const;
    readonly _publishedEvent = true as const;

    constructor(
        public readonly partyId: string,
        public readonly type: string,
        public readonly value: string
    ) {}
}
