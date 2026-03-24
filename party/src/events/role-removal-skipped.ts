import { PartyRelatedEvent } from './party-related-event.js';

export class RoleRemovalSkipped implements PartyRelatedEvent {
    readonly _partyRelatedEvent = true as const;

    private static readonly MISSING_ROLE_REASON = 'MISSING_ROLE';

    constructor(
        public readonly partyId: string,
        public readonly name: string,
        public readonly reason: string
    ) {}

    static dueToMissingRoleFor(partyId: string, name: string): RoleRemovalSkipped {
        return new RoleRemovalSkipped(partyId, name, RoleRemovalSkipped.MISSING_ROLE_REASON);
    }
}
