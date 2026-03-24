import { PartyId } from '../party-id.js';
import { AddressId } from '../address-id.js';
import { CapabilityId } from '../capability-id.js';
import { PartyRelationshipId } from '../party-relationship-id.js';
import type { RegisteredIdentifier } from '../registered-identifier.js';
import type { OperatingScope } from '../operating-scope.js';
import { Validity } from '../validity.js';

export class RegisterPersonCommand {
    constructor(
        public readonly firstName: string,
        public readonly lastName: string,
        public readonly roles: Set<string>,
        public readonly registeredIdentifiers: Set<RegisteredIdentifier>
    ) {}
}

export class RegisterCompanyCommand {
    constructor(
        public readonly organizationName: string,
        public readonly roles: Set<string>,
        public readonly registeredIdentifiers: Set<RegisteredIdentifier>
    ) {}
}

export class RegisterOrganizationUnitCommand {
    constructor(
        public readonly organizationName: string,
        public readonly roles: Set<string>,
        public readonly registeredIdentifiers: Set<RegisteredIdentifier>
    ) {}
}

export class AddRoleCommand {
    constructor(public readonly partyId: PartyId, public readonly role: string) {}
}

export class RemoveRoleCommand {
    constructor(public readonly partyId: PartyId, public readonly role: string) {}
}

export class AddRegisteredIdentifierCommand {
    constructor(public readonly partyId: PartyId, public readonly registeredIdentifier: RegisteredIdentifier) {}
}

export class RemoveRegisteredIdentifierCommand {
    constructor(public readonly partyId: PartyId, public readonly registeredIdentifier: RegisteredIdentifier) {}
}

export class UpdatePersonalDataCommand {
    constructor(public readonly partyId: PartyId, public readonly firstName: string, public readonly lastName: string) {}
}

export class UpdateOrganizationNameCommand {
    constructor(public readonly partyId: PartyId, public readonly organizationName: string) {}
}

export class GeoAddressDTO {
    constructor(
        public readonly addressId: AddressId,
        public readonly partyId: PartyId,
        public readonly name: string,
        public readonly street: string,
        public readonly building: string,
        public readonly flat: string,
        public readonly city: string,
        public readonly zipCode: string,
        public readonly locale: string,
        public readonly useTypes: Set<string>
    ) {}
}

export class AddOrUpdateGeoAddressCommand {
    constructor(public readonly partyId: PartyId, public readonly address: GeoAddressDTO) {}
}

export class RemoveAddressCommand {
    constructor(public readonly partyId: PartyId, public readonly addressId: AddressId) {}
}

export class AddCapabilityCommand {
    constructor(
        public readonly partyId: PartyId,
        public readonly capabilityType: string,
        public readonly scopes: OperatingScope[],
        public readonly validity: Validity = Validity.ALWAYS
    ) {}
}

export class RemoveCapabilityCommand {
    constructor(public readonly capabilityId: CapabilityId) {}
}

export class AssignPartyRelationshipCommand {
    constructor(
        public readonly fromPartyId: PartyId,
        public readonly fromRole: string,
        public readonly toPartyId: PartyId,
        public readonly toRole: string,
        public readonly relationshipName: string
    ) {}
}

export class RemovePartyRelationshipCommand {
    constructor(public readonly partyRelationshipId: PartyRelationshipId) {}
}
