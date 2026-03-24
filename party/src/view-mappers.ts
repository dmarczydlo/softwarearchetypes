import { Party } from './party.js';
import { Person } from './person.js';
import { Company } from './company.js';
import { OrganizationUnit } from './organization-unit.js';
import { Address } from './address.js';
import { GeoAddress, GeoAddressDetails } from './geo-address.js';
import { EmailAddress } from './email-address.js';
import { PhoneAddress } from './phone-address.js';
import { WebAddress } from './web-address.js';
import { EmailAddressDetails } from './email-address-details.js';
import { PhoneAddressDetails } from './phone-address-details.js';
import { WebAddressDetails } from './web-address-details.js';
import { PartyRelationship } from './party-relationship.js';
import {
    type PartyView, PersonView, CompanyView, OrganizationUnitView,
    type AddressView, GeoAddressView, EmailAddressView, PhoneAddressView, WebAddressView,
    PartyRelationshipView
} from './views.js';

export class PartyViewMapper {
    static toView(party: Party): PartyView {
        if (party instanceof Person) {
            return new PersonView(
                party.id(), party.personalData().firstName, party.personalData().lastName,
                new Set([...party.roles()].map(r => r.asString())),
                party.registeredIdentifiers(), party.version().value
            );
        }
        if (party instanceof Company) {
            return new CompanyView(
                party.id(), party.organizationName().asString(),
                new Set([...party.roles()].map(r => r.asString())),
                party.registeredIdentifiers(), party.version().value
            );
        }
        if (party instanceof OrganizationUnit) {
            return new OrganizationUnitView(
                party.id(), party.organizationName().asString(),
                new Set([...party.roles()].map(r => r.asString())),
                party.registeredIdentifiers(), party.version().value
            );
        }
        throw new Error('Unsupported party type');
    }
}

export class AddressViewMapper {
    static toView(address: Address): AddressView {
        if (address instanceof GeoAddress && address.addressDetails() instanceof GeoAddressDetails) {
            const details = address.addressDetails() as GeoAddressDetails;
            return new GeoAddressView(
                address.id(), address.partyId(), details.name, details.street, details.building,
                details.flat, details.city, details.zip.asString(), details.locale,
                new Set([...address.useTypes()]), address.validity()
            );
        }
        if (address instanceof EmailAddress && address.addressDetails() instanceof EmailAddressDetails) {
            const details = address.addressDetails() as EmailAddressDetails;
            return new EmailAddressView(address.id(), address.partyId(), details.email, new Set([...address.useTypes()]), address.validity());
        }
        if (address instanceof PhoneAddress && address.addressDetails() instanceof PhoneAddressDetails) {
            const details = address.addressDetails() as PhoneAddressDetails;
            return new PhoneAddressView(address.id(), address.partyId(), details.phoneNumber, new Set([...address.useTypes()]), address.validity());
        }
        if (address instanceof WebAddress && address.addressDetails() instanceof WebAddressDetails) {
            const details = address.addressDetails() as WebAddressDetails;
            return new WebAddressView(address.id(), address.partyId(), details.url, new Set([...address.useTypes()]), address.validity());
        }
        throw new Error('Unsupported address type: ' + address.constructor.name);
    }
}

export class PartyRelationshipViewMapper {
    static toView(relationship: PartyRelationship): PartyRelationshipView {
        return new PartyRelationshipView(
            relationship.id, relationship.from.partyId, relationship.from.role.asString(),
            relationship.to.partyId, relationship.to.role.asString(),
            relationship.name.asString(), relationship.validity
        );
    }
}
