import { PartyRelatedEvent } from './party-related-event.js';

export class RegisteredIdentifierAdditionSkipped implements PartyRelatedEvent {
    readonly _partyRelatedEvent = true as const;

    private static readonly DUPLICATION_REASON = 'DUPLICATION';

    constructor(
        public readonly partyId: string,
        public readonly type: string,
        public readonly value: string,
        public readonly reason: string
    ) {}

    static dueToDataDuplicationFor(partyId: string, type: string, value: string): RegisteredIdentifierAdditionSkipped {
        return new RegisteredIdentifierAdditionSkipped(partyId, type, value, RegisteredIdentifierAdditionSkipped.DUPLICATION_REASON);
    }
}
