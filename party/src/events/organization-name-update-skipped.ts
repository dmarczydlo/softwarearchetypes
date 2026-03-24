import { PartyRelatedEvent } from './party-related-event.js';

export class OrganizationNameUpdateSkipped implements PartyRelatedEvent {
    readonly _partyRelatedEvent = true as const;

    private static readonly NO_CHANGE_IDENTIFIED_REASON = 'NO_CHANGE_IDENTIFIED';

    constructor(
        public readonly partyId: string,
        public readonly value: string,
        public readonly reason: string
    ) {}

    static dueToNoChangeIdentifiedFor(partyId: string, value: string): OrganizationNameUpdateSkipped {
        return new OrganizationNameUpdateSkipped(partyId, value, OrganizationNameUpdateSkipped.NO_CHANGE_IDENTIFIED_REASON);
    }
}
