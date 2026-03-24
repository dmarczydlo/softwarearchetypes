import { AddressUpdateSucceeded } from './address-update-succeeded.js';

export class AddressUpdateSkipped implements AddressUpdateSucceeded {
    readonly _partyRelatedEvent = true as const;
    readonly _addressRelatedEvent = true as const;
    readonly _addressUpdateSucceeded = true as const;

    private static readonly NO_CHANGES_IDENTIFIED_REASON = 'NO_CHANGES_IDENTIFIED';

    constructor(
        public readonly addressId: string,
        public readonly partyId: string,
        public readonly reason: string
    ) {}

    static dueToNoChangesIdentifiedFor(addressId: string, partyId: string): AddressUpdateSkipped {
        return new AddressUpdateSkipped(addressId, partyId, AddressUpdateSkipped.NO_CHANGES_IDENTIFIED_REASON);
    }
}
