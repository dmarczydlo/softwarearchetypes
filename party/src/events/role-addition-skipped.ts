import { PartyRelatedEvent } from './party-related-event.js';

export class RoleAdditionSkipped implements PartyRelatedEvent {
    readonly _partyRelatedEvent = true as const;

    private static readonly DUPLICATION_REASON = 'DUPLICATION';

    constructor(
        public readonly partyId: string,
        public readonly name: string,
        public readonly reason: string
    ) {}

    static dueToDuplicationFor(partyId: string, name: string): RoleAdditionSkipped {
        return new RoleAdditionSkipped(partyId, name, RoleAdditionSkipped.DUPLICATION_REASON);
    }
}
