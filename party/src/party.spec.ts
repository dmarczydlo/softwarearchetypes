import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { Version } from '@softwarearchetypes/common';
import { PartyId } from './party-id.js';
import { AddressId } from './address-id.js';
import { PartyRelationshipId } from './party-relationship-id.js';
import { Role } from './role.js';
import { RelationshipName } from './relationship-name.js';
import { PersonalData } from './personal-data.js';
import { OrganizationName } from './organization-name.js';
import { Validity } from './validity.js';
import { PersonalIdentificationNumber } from './personal-identification-number.js';
import { TaxNumber } from './tax-number.js';
import { Passport } from './passport.js';
import { Person } from './person.js';
import { Company } from './company.js';
import { OrganizationUnit } from './organization-unit.js';
import { Party } from './party.js';
import { Addresses } from './addresses.js';
import { GeoAddress, GeoAddressDetails } from './geo-address.js';
import { ZipCode } from './zip-code.js';
import { AddressUseType } from './address-use-type.js';
import { EmailAddressDetails } from './email-address-details.js';
import { PhoneAddressDetails } from './phone-address-details.js';
import { WebAddressDetails } from './web-address-details.js';
import { PartyRole } from './party-role.js';
import { PartyRoleFactory } from './party-role-factory.js';
import { PartyRelationshipFactory } from './party-relationship-factory.js';
import { PartyConfiguration } from './party-configuration.js';
import { RegisterPersonCommand, RegisterCompanyCommand, RegisterOrganizationUnitCommand, AddRoleCommand, RemoveRoleCommand, AddRegisteredIdentifierCommand, RemoveRegisteredIdentifierCommand, UpdatePersonalDataCommand, UpdateOrganizationNameCommand, AssignPartyRelationshipCommand, RemovePartyRelationshipCommand, GeoAddressDTO, AddOrUpdateGeoAddressCommand, RemoveAddressCommand } from './commands/index.js';
import { RoleAdded } from './events/role-added.js';
import { RoleAdditionSkipped } from './events/role-addition-skipped.js';
import { RoleRemoved } from './events/role-removed.js';
import { RoleRemovalSkipped } from './events/role-removal-skipped.js';
import { RegisteredIdentifierAdded } from './events/registered-identifier-added.js';
import { RegisteredIdentifierAdditionSkipped } from './events/registered-identifier-addition-skipped.js';
import { RegisteredIdentifierRemoved } from './events/registered-identifier-removed.js';
import { RegisteredIdentifierRemovalSkipped } from './events/registered-identifier-removal-skipped.js';
import { PersonalDataUpdated } from './events/personal-data-updated.js';
import { PersonalDataUpdateSkipped } from './events/personal-data-update-skipped.js';
import { AddressRemovalSkipped } from './events/address-removal-skipped.js';
import { AddressUpdateSkipped } from './events/address-update-skipped.js';
import type { RegisteredIdentifier } from './registered-identifier.js';
import type { PublishedEvent } from './events/published-event.js';
import type { InMemoryEventObserver } from './events/in-memory-events-publisher.js';
import { PersonView, CompanyView, OrganizationUnitView, type PartyView } from './views.js';
import { RegisteredIdentifierDefiningPolicies } from './registered-identifier-defining-policy.js';

// === Test helpers ===
function randomString(prefix = ''): string {
    return prefix + '-' + Math.random().toString(36).substring(2, 12);
}

function somePersonalData(): PersonalData {
    return PersonalData.from(randomString('first'), randomString('last'));
}

function someRole(): Role {
    return Role.of(randomString('role'));
}

function someRegisteredIdentifier(): RegisteredIdentifier {
    const t = randomString('type');
    const v = randomString('value');
    return {
        type: () => t,
        asString: () => v,
        validity: () => Validity.ALWAYS,
        isCurrentlyValid: () => true,
        isValidAt: (instant: Date) => true
    };
}

function someOrganizationName(): OrganizationName {
    return OrganizationName.of(randomString('org'));
}

function somePerson(): Person {
    return new Person(PartyId.random(), PersonalData.empty(), new Set(), new Set(), Version.initial());
}

function someCompany(): Company {
    return new Company(PartyId.random(), someOrganizationName(), new Set(), new Set(), Version.initial());
}

function someGeoAddressFor(partyId: PartyId): GeoAddress {
    return new GeoAddress(
        AddressId.random(), partyId,
        GeoAddressDetails.from(randomString('name'), randomString('street'), '1', '2', randomString('city'), ZipCode.of('00-000'), 'en'),
        new Set([AddressUseType.RESIDENTIAL])
    );
}

function someGeoAddressWith(addressId: AddressId, partyId: PartyId): GeoAddress {
    return new GeoAddress(
        addressId, partyId,
        GeoAddressDetails.from(randomString('name'), randomString('street'), '3', '4', randomString('city'), ZipCode.of('11-111'), 'en'),
        new Set([AddressUseType.MAILING])
    );
}

function someGeoAddressDTOFor(partyId: PartyId, useType: AddressUseType = AddressUseType.RESIDENTIAL): GeoAddressDTO {
    return new GeoAddressDTO(AddressId.random(), partyId, randomString('n'), randomString('s'), '1', '2', randomString('c'), '00-000', 'en', new Set([useType]));
}

function someGeoAddressDTOWithId(addressId: AddressId, partyId: PartyId, useType: AddressUseType): GeoAddressDTO {
    return new GeoAddressDTO(addressId, partyId, randomString('n'), randomString('s'), '1', '2', randomString('c'), '00-000', 'en', new Set([useType]));
}

function geoAddressDTOWith(partyId: PartyId, name: string, city: string, ...useTypes: AddressUseType[]): GeoAddressDTO {
    return new GeoAddressDTO(AddressId.random(), partyId, name, randomString('s'), '1', '2', city, '00-000', 'en', new Set(useTypes.map(u => u as string)));
}

// === PartyId Tests ===
describe('PartyId', () => {
    it('two PartyIds should not be equal when created for different values', () => {
        const first = PartyId.of(randomUUID());
        const second = PartyId.of(randomUUID());
        expect(first.asString()).not.toBe(second.asString());
    });
    it('two PartyIds should be equal when created for the same value', () => {
        const value = randomUUID();
        expect(PartyId.of(value).asString()).toBe(PartyId.of(value).asString());
    });
    it('partyId is convertible to the value it was created from', () => {
        const value = randomUUID();
        expect(PartyId.of(value).asString()).toBe(value);
    });
    it('should not allow to create PartyId for null value', () => {
        expect(() => PartyId.of(null as unknown as string)).toThrow();
    });
});

// === AddressId Tests ===
describe('AddressId', () => {
    it('two AddressIds should not be equal when created for different values', () => {
        expect(AddressId.of(randomUUID()).asString()).not.toBe(AddressId.of(randomUUID()).asString());
    });
    it('should not allow to create AddressId for null value', () => {
        expect(() => AddressId.of(null as unknown as string)).toThrow();
    });
});

// === PartyRelationshipId Tests ===
describe('PartyRelationshipId', () => {
    it('two ids should not be equal when created for different values', () => {
        expect(PartyRelationshipId.of(randomUUID()).asString()).not.toBe(PartyRelationshipId.of(randomUUID()).asString());
    });
    it('should not allow null value', () => {
        expect(() => PartyRelationshipId.of(null as unknown as string)).toThrow();
    });
});

// === Role Tests ===
describe('Role', () => {
    it('two roles should not be equal when created for different values', () => {
        expect(Role.of(randomString()).asString()).not.toBe(Role.of(randomString()).asString());
    });
    it('two roles should be equal when created for the same value', () => {
        const v = randomString();
        expect(Role.of(v).asString()).toBe(Role.of(v).asString());
    });
    it('should not allow null', () => { expect(() => Role.of(null as unknown as string)).toThrow(); });
    it('should not allow empty', () => { expect(() => Role.of('')).toThrow(); });
});

// === RelationshipName Tests ===
describe('RelationshipName', () => {
    it('two relationship names should not be equal when different', () => {
        expect(RelationshipName.of(randomString()).asString()).not.toBe(RelationshipName.of(randomString()).asString());
    });
    it('should not allow null', () => { expect(() => RelationshipName.of(null as unknown as string)).toThrow(); });
    it('should not allow empty', () => { expect(() => RelationshipName.of('')).toThrow(); });
});

// === PersonalData Tests ===
describe('PersonalData', () => {
    it('two PersonalData should not be equal when different', () => {
        const a = PersonalData.from(randomString(), randomString());
        const b = PersonalData.from(randomString(), randomString());
        expect(a.firstName).not.toBe(b.firstName);
    });
    it('should create with empty values for null', () => {
        const data = PersonalData.from(null, null);
        expect(data.firstName).toBe('');
        expect(data.lastName).toBe('');
    });
});

// === Validity Tests ===
describe('Validity', () => {
    it('should create always valid period', () => {
        const validity = Validity.always();
        expect(validity.isValidAt(new Date(0))).toBe(true);
        expect(validity.isValidAt(new Date())).toBe(true);
        expect(validity.hasExpired(new Date())).toBe(false);
    });
    it('should create validity from specific instant', () => {
        const from = new Date('2025-01-01T00:00:00Z');
        const validity = Validity.from(from);
        expect(validity.isValidAt(new Date('2024-12-31T23:59:59Z'))).toBe(false);
        expect(validity.isValidAt(new Date('2025-01-01T00:00:00Z'))).toBe(true);
    });
    it('should create validity until specific instant', () => {
        const until = new Date('2030-12-31T23:59:59Z');
        const validity = Validity.until(until);
        expect(validity.isValidAt(new Date(0))).toBe(true);
        expect(validity.isValidAt(new Date('2030-12-31T23:59:59Z'))).toBe(false);
    });
    it('should check overlap', () => {
        const p1 = Validity.between(new Date('2024-01-01'), new Date('2024-12-31'));
        const p2 = Validity.between(new Date('2024-06-01'), new Date('2025-06-01'));
        expect(p1.overlaps(p2)).toBe(true);
    });
    it('non-overlapping periods do not overlap', () => {
        const p1 = Validity.between(new Date('2024-01-01'), new Date('2024-06-01'));
        const p2 = Validity.between(new Date('2024-06-01'), new Date('2024-12-31'));
        expect(p1.overlaps(p2)).toBe(false);
    });
    it('should handle null instants in between method', () => {
        const always = Validity.between(null, null);
        expect(always.isValidAt(new Date())).toBe(true);
    });
});

// === PersonalIdentificationNumber Tests ===
describe('PersonalIdentificationNumber', () => {
    const CHECKSUM_WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
    function generateValidPESEL(): string {
        let withoutChecksum = '';
        for (let i = 0; i < 10; i++) withoutChecksum += Math.floor(Math.random() * 10);
        let sum = 0;
        for (let i = 0; i < 10; i++) sum += parseInt(withoutChecksum[i]) * CHECKSUM_WEIGHTS[i];
        return withoutChecksum + ((10 - (sum % 10)) % 10);
    }
    it('should accept valid PESEL', () => {
        const p = PersonalIdentificationNumber.of('44051401458');
        expect(p.asString()).toBe('44051401458');
        expect(p.type()).toBe('PERSONAL_IDENTIFICATION_NUMBER');
    });
    it('should reject invalid checksum', () => {
        expect(() => PersonalIdentificationNumber.of('44051401459')).toThrow();
    });
    it('should reject null', () => { expect(() => PersonalIdentificationNumber.of(null as unknown as string)).toThrow(); });
    it('should reject letters', () => { expect(() => PersonalIdentificationNumber.of('abcdefghijk')).toThrow(); });
    it('should reject wrong length', () => {
        expect(() => PersonalIdentificationNumber.of('1234567890')).toThrow();
        expect(() => PersonalIdentificationNumber.of('123456789012')).toThrow();
    });
    it('generated valid PESELs should be accepted', () => {
        for (let i = 0; i < 5; i++) {
            const pesel = generateValidPESEL();
            expect(() => PersonalIdentificationNumber.of(pesel)).not.toThrow();
        }
    });
});

// === TaxNumber Tests ===
describe('TaxNumber', () => {
    it('should accept valid NIP', () => {
        const t = TaxNumber.of('1234563218');
        expect(t.asString()).toBe('1234563218');
        expect(t.type()).toBe('TAX_NUMBER');
    });
    it('should reject invalid checksum', () => { expect(() => TaxNumber.of('1234563219')).toThrow(); });
    it('should reject null', () => { expect(() => TaxNumber.of(null as unknown as string)).toThrow(); });
});

// === Passport Tests ===
describe('Passport', () => {
    it('should create passport with validity period', () => {
        const v = Validity.between(new Date(Date.now() - 86400000), new Date(Date.now() + 86400000));
        const p = Passport.of('AB1234567', v);
        expect(p.asString()).toBe('AB1234567');
        expect(p.type()).toBe('PASSPORT');
        expect(p.isCurrentlyValid()).toBe(true);
    });
    it('should reject invalid format', () => { expect(() => Passport.of('123456789', Validity.always())).toThrow(); });
    it('should reject null validity', () => { expect(() => Passport.of('AB1234567', null as unknown as Validity)).toThrow(); });
});

// === EmailAddressDetails Tests ===
describe('EmailAddressDetails', () => {
    it('should create valid email', () => {
        expect(new EmailAddressDetails('user@domain.com').email).toBe('user@domain.com');
    });
    it('should reject null', () => { expect(() => new EmailAddressDetails(null as unknown as string)).toThrow(); });
    it('should reject empty', () => { expect(() => new EmailAddressDetails('')).toThrow(); });
    it('should reject invalid format', () => { expect(() => new EmailAddressDetails('invalid')).toThrow(); });
});

// === PhoneAddressDetails Tests ===
describe('PhoneAddressDetails', () => {
    it('should create valid phone', () => {
        expect(new PhoneAddressDetails('+48123456789').phoneNumber).toBe('+48123456789');
    });
    it('should reject null', () => { expect(() => new PhoneAddressDetails(null as unknown as string)).toThrow(); });
    it('should reject empty', () => { expect(() => new PhoneAddressDetails('')).toThrow(); });
    it('should normalize phone number', () => {
        expect(new PhoneAddressDetails('+48 123 456 789').normalized()).toBe('+48123456789');
    });
});

// === WebAddressDetails Tests ===
describe('WebAddressDetails', () => {
    it('should create valid URL', () => {
        expect(new WebAddressDetails('https://example.com').url).toBe('https://example.com');
    });
    it('should reject null', () => { expect(() => new WebAddressDetails(null as unknown as string)).toThrow(); });
    it('should reject invalid', () => { expect(() => new WebAddressDetails('not a url')).toThrow(); });
    it('should extract protocol', () => {
        expect(new WebAddressDetails('https://example.com').protocol()).toBe('https');
    });
    it('should extract host', () => {
        expect(new WebAddressDetails('https://example.com').host()).toBe('example.com');
    });
});

// === Person Tests ===
describe('Person', () => {
    it('should update personal data', () => {
        const person = somePerson();
        const data = somePersonalData();
        const result = person.update(data);
        expect(result.success()).toBe(true);
        expect(person.personalData().firstName).toBe(data.firstName);
    });
    it('should generate PersonalDataUpdated event on change', () => {
        const person = somePerson();
        const data = somePersonalData();
        person.update(data);
        const events = person.events();
        expect(events.some(e => e instanceof PersonalDataUpdated)).toBe(true);
    });
    it('should generate PersonalDataUpdateSkipped when no changes', () => {
        const data = somePersonalData();
        const person = new Person(PartyId.random(), data, new Set(), new Set(), Version.initial());
        person.update(data);
        expect(person.events().some(e => e instanceof PersonalDataUpdateSkipped)).toBe(true);
    });
});

// === Party Roles Tests (works for Person, Company, OrganizationUnit) ===
describe('Party roles', () => {
    function makeParty(): Person {
        return new Person(PartyId.random(), PersonalData.empty(), new Set(), new Set(), Version.initial());
    }

    it('should add role', () => {
        const party = makeParty();
        const role = someRole();
        expect(party.add(role).success()).toBe(true);
        expect([...party.roles()].some(r => r.asString() === role.asString())).toBe(true);
    });
    it('should emit RoleAdded event', () => {
        const party = makeParty();
        const role = someRole();
        party.add(role);
        expect(party.events().some(e => e instanceof RoleAdded && e.name === role.asString())).toBe(true);
    });
    it('should emit RoleAdditionSkipped when duplicate', () => {
        const role = someRole();
        const party = new Person(PartyId.random(), PersonalData.empty(), new Set([role]), new Set(), Version.initial());
        party.add(role);
        expect(party.events().some(e => e instanceof RoleAdditionSkipped)).toBe(true);
    });
    it('should remove role', () => {
        const role = someRole();
        const party = new Person(PartyId.random(), PersonalData.empty(), new Set([role]), new Set(), Version.initial());
        expect(party.remove(role).success()).toBe(true);
        expect([...party.roles()].some(r => r.asString() === role.asString())).toBe(false);
    });
    it('should emit RoleRemoved event', () => {
        const role = someRole();
        const party = new Person(PartyId.random(), PersonalData.empty(), new Set([role]), new Set(), Version.initial());
        party.remove(role);
        expect(party.events().some(e => e instanceof RoleRemoved)).toBe(true);
    });
    it('should emit RoleRemovalSkipped for missing role', () => {
        const party = makeParty();
        party.remove(someRole());
        expect(party.events().some(e => e instanceof RoleRemovalSkipped)).toBe(true);
    });
});

// === Party RegisteredIdentifiers Tests ===
describe('Party registered identifiers', () => {
    it('should add identifier', () => {
        const party = somePerson();
        const id = someRegisteredIdentifier();
        expect(party.add(id).success()).toBe(true);
        expect([...party.registeredIdentifiers()].some(ri => ri.asString() === id.asString())).toBe(true);
    });
    it('should emit RegisteredIdentifierAdded', () => {
        const party = somePerson();
        const id = someRegisteredIdentifier();
        party.add(id);
        expect(party.events().some(e => e instanceof RegisteredIdentifierAdded)).toBe(true);
    });
    it('should emit skip event for duplicate', () => {
        const id = someRegisteredIdentifier();
        const party = new Person(PartyId.random(), PersonalData.empty(), new Set(), new Set([id]), Version.initial());
        party.add(id);
        expect(party.events().some(e => e instanceof RegisteredIdentifierAdditionSkipped)).toBe(true);
    });
    it('should remove identifier', () => {
        const id = someRegisteredIdentifier();
        const party = new Person(PartyId.random(), PersonalData.empty(), new Set(), new Set([id]), Version.initial());
        expect(party.remove(id).success()).toBe(true);
    });
});

// === Addresses Tests ===
describe('Addresses', () => {
    it('should add address', () => {
        const partyId = PartyId.random();
        const address = someGeoAddressFor(partyId);
        const addresses = Addresses.emptyAddressesFor(partyId);
        expect(addresses.addOrUpdate(address).success()).toBe(true);
    });
    it('should update existing address', () => {
        const partyId = PartyId.random();
        const address = someGeoAddressFor(partyId);
        const addresses = Addresses.emptyAddressesFor(partyId);
        addresses.addOrUpdate(address);
        const newAddress = someGeoAddressWith(address.id(), partyId);
        expect(addresses.addOrUpdate(newAddress).success()).toBe(true);
    });
    it('should remove address', () => {
        const partyId = PartyId.random();
        const address = someGeoAddressFor(partyId);
        const addresses = Addresses.emptyAddressesFor(partyId);
        addresses.addOrUpdate(address);
        expect(addresses.removeAddressWith(address.id()).success()).toBe(true);
    });
    it('address removal should be ignored when not found', () => {
        const addresses = Addresses.emptyAddressesFor(PartyId.random());
        expect(addresses.removeAddressWith(AddressId.random()).success()).toBe(true);
    });
    it('should generate skip event when no changes', () => {
        const partyId = PartyId.random();
        const address = someGeoAddressFor(partyId);
        const addresses = Addresses.emptyAddressesFor(partyId);
        addresses.addOrUpdate(address);
        addresses.addOrUpdate(address);
        expect(addresses.events().some(e => e instanceof AddressUpdateSkipped)).toBe(true);
    });
});

// === PartyRoleFactory Tests ===
describe('PartyRoleFactory', () => {
    it('should create party role with accept all policy', () => {
        const factory = new PartyRoleFactory();
        const party = somePerson();
        const role = someRole();
        const result = factory.defineFor(party, role);
        expect(result.success()).toBe(true);
    });
    it('should fail with restrictive policy', () => {
        const factory = new PartyRoleFactory({ canDefineFor: (p) => p._partyType === 'COMPANY' });
        const party = somePerson();
        const result = factory.defineFor(party, someRole());
        expect(result.failure()).toBe(true);
    });
});

// === PartyRelationshipFactory Tests ===
describe('PartyRelationshipFactory', () => {
    it('should create relationship with accept all policy', () => {
        const factory = new PartyRelationshipFactory(null, () => PartyRelationshipId.random());
        const from = PartyRole.of(PartyId.random(), someRole());
        const to = PartyRole.of(PartyId.random(), someRole());
        const result = factory.defineFor(from, to, RelationshipName.of(randomString()));
        expect(result.success()).toBe(true);
    });
});

// === RegisteredIdentifierDefiningPolicy Tests ===
describe('RegisteredIdentifierDefiningPolicy', () => {
    it('allowAll should allow any identifier for any party', () => {
        const policy = RegisteredIdentifierDefiningPolicies.allowAll();
        const person = somePerson();
        const pesel = PersonalIdentificationNumber.of('44051401359');
        expect(policy.canRegister(person, pesel)).toBe(true);
    });
    it('personalIdentifiers policy should restrict PESEL to persons', () => {
        const policy = RegisteredIdentifierDefiningPolicies.personalIdentifiersOnlyForPersons();
        const person = somePerson();
        const company = someCompany();
        const pesel = PersonalIdentificationNumber.of('44051401359');
        expect(policy.canRegister(person, pesel)).toBe(true);
        expect(policy.canRegister(company, pesel)).toBe(false);
    });
    it('add should return failure for personal identifier on company', () => {
        const company = someCompany();
        const pesel = PersonalIdentificationNumber.of('44051401359');
        const result = company.add(pesel);
        expect(result.failure()).toBe(true);
        expect(result.getFailure()).toBe('IDENTIFIER_NOT_ALLOWED_FOR_PARTY_TYPE');
    });
});

// === PartiesFacade Tests ===
describe('PartiesFacade', () => {
    let config: PartyConfiguration;
    beforeEach(() => { config = PartyConfiguration.inMemory(); });

    it('can register person', () => {
        const result = config.partiesFacade.handle(new RegisterPersonCommand('Jan', 'Kowalski', new Set(), new Set()));
        expect(result.success()).toBe(true);
        expect((result.getSuccess() as PartyView).partyType()).toBe('PERSON');
    });
    it('can register company', () => {
        const result = config.partiesFacade.handle(new RegisterCompanyCommand('ACME', new Set(), new Set()));
        expect(result.success()).toBe(true);
        expect((result.getSuccess() as PartyView).partyType()).toBe('COMPANY');
    });
    it('can register organization unit', () => {
        const result = config.partiesFacade.handle(new RegisterOrganizationUnitCommand('HR', new Set(), new Set()));
        expect(result.success()).toBe(true);
        expect((result.getSuccess() as PartyView).partyType()).toBe('ORGANIZATION_UNIT');
    });
    it('can add role', () => {
        const partyId = (config.partiesFacade.handle(new RegisterPersonCommand('A', 'B', new Set(), new Set())).getSuccess() as PartyView).partyId;
        const result = config.partiesFacade.handle(new AddRoleCommand(partyId, 'Customer'));
        expect(result.success()).toBe(true);
        const party = config.partiesQueries.findBy(partyId);
        expect(party!.roles.has('Customer')).toBe(true);
    });
    it('can remove role', () => {
        const partyId = (config.partiesFacade.handle(new RegisterPersonCommand('A', 'B', new Set(['X']), new Set())).getSuccess() as PartyView).partyId;
        config.partiesFacade.handle(new AddRoleCommand(partyId, 'X'));
        const result = config.partiesFacade.handle(new RemoveRoleCommand(partyId, 'X'));
        expect(result.success()).toBe(true);
    });
    it('can add and remove registered identifier', () => {
        const partyId = (config.partiesFacade.handle(new RegisterPersonCommand('A', 'B', new Set(), new Set())).getSuccess() as PartyView).partyId;
        const id = someRegisteredIdentifier();
        expect(config.partiesFacade.handle(new AddRegisteredIdentifierCommand(partyId, id)).success()).toBe(true);
        expect(config.partiesFacade.handle(new RemoveRegisteredIdentifierCommand(partyId, id)).success()).toBe(true);
    });
    it('can update personal data', () => {
        const partyId = (config.partiesFacade.handle(new RegisterPersonCommand('A', 'B', new Set(), new Set())).getSuccess() as PartyView).partyId;
        const result = config.partiesFacade.handle(new UpdatePersonalDataCommand(partyId, 'New', 'Name'));
        expect(result.success()).toBe(true);
    });
    it('cannot update personal data of organization', () => {
        const partyId = (config.partiesFacade.handle(new RegisterCompanyCommand('ACME', new Set(), new Set())).getSuccess() as PartyView).partyId;
        const result = config.partiesFacade.handle(new UpdatePersonalDataCommand(partyId, 'New', 'Name'));
        expect(result.failure()).toBe(true);
    });
    it('add role fails for non-existing party', () => {
        const result = config.partiesFacade.handle(new AddRoleCommand(PartyId.random(), 'X'));
        expect(result.failure()).toBe(true);
    });
});

// === AddressesFacade Tests ===
describe('AddressesFacade', () => {
    let config: PartyConfiguration;
    beforeEach(() => { config = PartyConfiguration.inMemory(); });

    it('can add address', () => {
        const partyId = (config.partiesFacade.handle(new RegisterPersonCommand('A', 'B', new Set(), new Set())).getSuccess() as PartyView).partyId;
        const dto = geoAddressDTOWith(partyId, 'Home', 'Warsaw', AddressUseType.RESIDENTIAL);
        const result = config.addressesFacade.handle(new AddOrUpdateGeoAddressCommand(partyId, dto));
        expect(result.success()).toBe(true);
        expect(config.addressesQueries.findAllFor(partyId).length).toBe(1);
    });
    it('can remove address', () => {
        const partyId = (config.partiesFacade.handle(new RegisterPersonCommand('A', 'B', new Set(), new Set())).getSuccess() as PartyView).partyId;
        const addressId = AddressId.random();
        config.addressesFacade.handle(new AddOrUpdateGeoAddressCommand(partyId, someGeoAddressDTOWithId(addressId, partyId, AddressUseType.RESIDENTIAL)));
        const result = config.addressesFacade.handle(new RemoveAddressCommand(partyId, addressId));
        expect(result.success()).toBe(true);
        expect(config.addressesQueries.findAllFor(partyId).length).toBe(0);
    });
});

// === PartyRelationshipsFacade Tests ===
describe('PartyRelationshipsFacade', () => {
    let config: PartyConfiguration;
    beforeEach(() => { config = PartyConfiguration.inMemory(); });

    function registerPerson(): PartyId {
        return (config.partiesFacade.handle(new RegisterPersonCommand(randomString(), randomString(), new Set(), new Set())).getSuccess() as PartyView).partyId;
    }

    it('should fail when from party does not exist', () => {
        const toPartyId = registerPerson();
        const result = config.partyRelationshipsFacade.handle(
            new AssignPartyRelationshipCommand(PartyId.random(), 'X', toPartyId, 'Y', 'Z'));
        expect(result.failure()).toBe(true);
        expect(result.getFailure()).toBe('PARTY_NOT_FOUND');
    });
    it('should add relationship between parties', () => {
        const from = registerPerson();
        const to = registerPerson();
        const result = config.partyRelationshipsFacade.handle(
            new AssignPartyRelationshipCommand(from, 'Employee', to, 'Employer', 'Employment'));
        expect(result.success()).toBe(true);
    });
    it('should remove relationship', () => {
        const from = registerPerson();
        const to = registerPerson();
        const rel = config.partyRelationshipsFacade.handle(
            new AssignPartyRelationshipCommand(from, 'A', to, 'B', 'C')).getSuccess() as any;
        const result = config.partyRelationshipsFacade.handle(new RemovePartyRelationshipCommand(rel.id));
        expect(result.success()).toBe(true);
    });
});

// === GeoAddress Tests ===
describe('GeoAddress', () => {
    it('should contain data passed when creating it', () => {
        const addressId = AddressId.random();
        const partyId = PartyId.random();
        const details = GeoAddressDetails.from('n', 's', 'b', 'f', 'c', ZipCode.of('00-000'), 'en');
        const useTypes = new Set([AddressUseType.BILLING]);
        const address = new GeoAddress(addressId, partyId, details, useTypes);
        expect(address.id().asString()).toBe(addressId.asString());
        expect(address.partyId().asString()).toBe(partyId.asString());
        expect(address.name()).toBe('n');
    });
    it('should create definition event', () => {
        const address = someGeoAddressFor(PartyId.random());
        const event = address.toAddressDefinitionSucceededEvent();
        expect(event.addressId).toBe(address.id().asString());
    });
});
