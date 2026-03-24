import { PartyRegistered } from './party-registered.js';

export class OrganizationUnitRegistered implements PartyRegistered {
    readonly _partyRelatedEvent = true as const;
    readonly _publishedEvent = true as const;

    constructor(
        public readonly partyId: string,
        public readonly organizationName: string,
        public readonly registeredIdentifiers: Set<string>,
        public readonly roles: Set<string>
    ) {}
}
