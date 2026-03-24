import { PartyRelatedEvent } from './party-related-event.js';

export class RegisteredIdentifierRemovalSkipped implements PartyRelatedEvent {
    readonly _partyRelatedEvent = true as const;

    private static readonly MISSING_IDENTIFIER_REASON = 'MISSING_IDENTIFIER';

    constructor(
        public readonly partyId: string,
        public readonly type: string,
        public readonly value: string,
        public readonly reason: string
    ) {}

    static dueToMissingIdentifierFor(partyId: string, type: string, value: string): RegisteredIdentifierRemovalSkipped {
        return new RegisteredIdentifierRemovalSkipped(partyId, type, value, RegisteredIdentifierRemovalSkipped.MISSING_IDENTIFIER_REASON);
    }
}
