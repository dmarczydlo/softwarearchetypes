import { PartyId } from './party-id.js';
import { AddressId } from './address-id.js';
import { PartyRelationshipId } from './party-relationship-id.js';
import { CapabilityId } from './capability-id.js';
import { CapabilityType } from './capability-type.js';
import type { RegisteredIdentifier } from './registered-identifier.js';
import type { OperatingScope } from './operating-scope.js';
import { Validity } from './validity.js';
import type { Capability } from './capability.js';

export interface PartyView {
    readonly partyId: PartyId;
    partyType(): string;
    readonly roles: Set<string>;
    readonly registeredIdentifiers: Set<RegisteredIdentifier>;
    readonly version: number;
}

export class PersonView implements PartyView {
    constructor(
        public readonly partyId: PartyId,
        public readonly firstName: string,
        public readonly lastName: string,
        public readonly roles: Set<string>,
        public readonly registeredIdentifiers: Set<RegisteredIdentifier>,
        public readonly version: number
    ) {}
    partyType(): string { return 'PERSON'; }
}

export class CompanyView implements PartyView {
    constructor(
        public readonly partyId: PartyId,
        public readonly organizationName: string,
        public readonly roles: Set<string>,
        public readonly registeredIdentifiers: Set<RegisteredIdentifier>,
        public readonly version: number
    ) {}
    partyType(): string { return 'COMPANY'; }
}

export class OrganizationUnitView implements PartyView {
    constructor(
        public readonly partyId: PartyId,
        public readonly organizationName: string,
        public readonly roles: Set<string>,
        public readonly registeredIdentifiers: Set<RegisteredIdentifier>,
        public readonly version: number
    ) {}
    partyType(): string { return 'ORGANIZATION_UNIT'; }
}

export interface AddressView {
    readonly addressId: AddressId;
    readonly partyId: PartyId;
    readonly useTypes: Set<string>;
    readonly validity: Validity;
}

export class GeoAddressView implements AddressView {
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
        public readonly useTypes: Set<string>,
        public readonly validity: Validity
    ) {}
}

export class EmailAddressView implements AddressView {
    constructor(
        public readonly addressId: AddressId,
        public readonly partyId: PartyId,
        public readonly email: string,
        public readonly useTypes: Set<string>,
        public readonly validity: Validity
    ) {}
}

export class PhoneAddressView implements AddressView {
    constructor(
        public readonly addressId: AddressId,
        public readonly partyId: PartyId,
        public readonly phoneNumber: string,
        public readonly useTypes: Set<string>,
        public readonly validity: Validity
    ) {}
}

export class WebAddressView implements AddressView {
    constructor(
        public readonly addressId: AddressId,
        public readonly partyId: PartyId,
        public readonly url: string,
        public readonly useTypes: Set<string>,
        public readonly validity: Validity
    ) {}
}

export class CapabilityView {
    constructor(
        public readonly id: CapabilityId,
        public readonly partyId: PartyId,
        public readonly type: CapabilityType,
        public readonly scopes: OperatingScope[],
        public readonly validity: Validity
    ) {}

    static from(capability: Capability): CapabilityView {
        return new CapabilityView(capability.id, capability.partyId, capability.type, capability.scopes, capability.validity);
    }
}

export class PartyRelationshipView {
    constructor(
        public readonly id: PartyRelationshipId,
        public readonly fromPartyId: PartyId,
        public readonly fromRole: string,
        public readonly toPartyId: PartyId,
        public readonly toRole: string,
        public readonly relationshipName: string,
        public readonly validity: Validity
    ) {}
}
