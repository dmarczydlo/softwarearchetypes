import { PartyRelatedEvent } from './party-related-event.js';

export class PersonalDataUpdateSkipped implements PartyRelatedEvent {
    readonly _partyRelatedEvent = true as const;

    private static readonly NO_CHANGE_IDENTIFIED_REASON = 'NO_CHANGE_IDENTIFIED';

    constructor(
        public readonly partyId: string,
        public readonly firstName: string,
        public readonly lastName: string,
        public readonly reason: string
    ) {}

    static dueToNoChangeIdentifiedFor(partyId: string, firstName: string, lastName: string): PersonalDataUpdateSkipped {
        return new PersonalDataUpdateSkipped(partyId, firstName, lastName, PersonalDataUpdateSkipped.NO_CHANGE_IDENTIFIED_REASON);
    }
}
