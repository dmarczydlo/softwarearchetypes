import { AddressRemovalSucceeded } from './address-removal-succeeded.js';

export class AddressRemovalSkipped implements AddressRemovalSucceeded {
    readonly _partyRelatedEvent = true as const;
    readonly _addressRelatedEvent = true as const;
    readonly _addressRemovalSucceeded = true as const;

    private static readonly ADDRESS_NOT_FOUND_REASON = 'ADDRESS_NOT_FOUND';

    constructor(
        public readonly addressId: string,
        public readonly partyId: string,
        public readonly reason: string
    ) {}

    static dueToAddressNotFoundFor(addressId: string, partyId: string): AddressRemovalSkipped {
        return new AddressRemovalSkipped(addressId, partyId, AddressRemovalSkipped.ADDRESS_NOT_FOUND_REASON);
    }
}
