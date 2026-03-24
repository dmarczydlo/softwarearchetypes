import { PartyRegistered } from './party-registered.js';

export class PersonRegistered implements PartyRegistered {
    readonly _partyRelatedEvent = true as const;
    readonly _publishedEvent = true as const;

    constructor(
        public readonly partyId: string,
        public readonly firstName: string,
        public readonly lastName: string,
        public readonly registeredIdentifiers: Set<string>,
        public readonly roles: Set<string>
    ) {}
}
