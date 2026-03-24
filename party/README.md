# @softwarearchetypes/party

## What is this archetype?

The party archetype models people and organizations as "parties" with addresses, roles, capabilities, and relationships. It provides a unified abstraction for persons and organizations (companies, organization units), multiple address types (geographic, email, phone, web), role-based access and behavior, capability/skill tracking with operating scopes, and inter-party relationships with defining policies.

## When to use this archetype

- You need to model people (persons) and organizations (companies, departments) in a unified way
- You are building a CRM, user management, or identity system
- You need multi-type addresses: physical/geo, email, phone, web -- each with use types and validity
- You want to assign roles to parties with defining policies that control role assignment rules
- You need capability/skill tracking with scopes (location, temporal, quantity, skill level, protocol)
- You are modeling relationships between parties (employer-employee, parent-subsidiary, supplier-customer)
- You need registered identifiers (tax numbers, passport numbers, personal ID numbers)

## Key concepts

- **Party** - Abstract base for Person and Organization
- **Person** - A party representing an individual with personal data
- **Organization / Company / OrganizationUnit** - Parties representing legal entities or departments
- **Address** - Base for GeoAddress, EmailAddress, PhoneAddress, WebAddress -- each with details and use type
- **PartyRole** - A role played by a party (e.g., customer, supplier, employee) with defining policies
- **PartyRelationship** - A typed, directed relationship between two parties with validity period
- **Capability** - A skill or ability a party possesses, with operating scopes
- **OperatingScope** - Constrains capabilities: LocationScope, TemporalScope, QuantityScope, SkillLevelScope, ProtocolScope, ProductScope, ResourceScope
- **RegisteredIdentifier** - Identity documents: Passport, TaxNumber, PersonalIdentificationNumber
- **PartiesFacade / AddressesFacade / CapabilitiesFacade / PartyRelationshipsFacade** - High-level APIs
- **PartyConfiguration** - Wires up repositories, facades, and queries

## Installation

Clone the repository and install locally:

```bash
git clone <repo-url> archetypes-typescript
cd archetypes-typescript
npm install
```

Then link the archetype into your project:

```bash
npm install ../archetypes-typescript/party
```

## Dependencies

- `@softwarearchetypes/common`

## Quick example

```typescript
import { PartyConfiguration } from '@softwarearchetypes/party';

const config = PartyConfiguration.inMemory();
const parties = config.partiesFacade();
const addresses = config.addressesFacade();
const relationships = config.partyRelationshipsFacade();
const capabilities = config.capabilitiesFacade();

// Create a person
const personResult = parties.createPerson({
  firstName: "Jan",
  lastName: "Kowalski",
});
const personId = personResult.getSuccess();

// Add an email address
addresses.addEmailAddress(personId, {
  email: "jan@example.com",
  useType: "WORK",
});

// Add a phone number
addresses.addPhoneAddress(personId, {
  number: "+48 600 123 456",
  useType: "MOBILE",
});

// Create a company and link the person as an employee
const companyResult = parties.createOrganization({
  name: "Acme Corp",
  legalName: "Acme Corporation Sp. z o.o.",
});
const companyId = companyResult.getSuccess();

addresses.addGeoAddress(companyId, {
  street: "ul. Marszałkowska 1",
  city: "Warsaw",
  postalCode: "00-001",
  country: "PL",
  useType: "REGISTERED",
});

// Establish an employer-employee relationship
relationships.createRelationship({
  fromPartyId: companyId,
  toPartyId: personId,
  relationshipType: "EMPLOYMENT",
  validFrom: new Date("2024-01-15"),
});

// Add a capability to the person
capabilities.addCapability(personId, {
  capabilityType: "SKILL",
  name: "TypeScript",
  scopes: [{ scopeType: "SKILL_LEVEL", level: "SENIOR" }],
});
```

## Real-world usage examples

### CRM contact management (Salesforce-style accounts and contacts)

A CRM models companies as accounts and individuals as contacts, linking each contact to one or more accounts via relationships. Roles distinguish prospects from paying customers.

```typescript
import { PartyConfiguration } from '@softwarearchetypes/party';

const config = PartyConfiguration.inMemory();
const parties = config.partiesFacade();
const addresses = config.addressesFacade();
const relationships = config.partyRelationshipsFacade();

// Account (company)
const accountResult = parties.createOrganization({ name: "Globex Ltd" });
const accountId = accountResult.getSuccess();

addresses.addWebAddress(accountId, {
  url: "https://globex.example.com",
  useType: "CORPORATE",
});

// Contact (person) linked to the account
const contactResult = parties.createPerson({
  firstName: "Alice",
  lastName: "Smith",
  title: "VP of Engineering",
});
const contactId = contactResult.getSuccess();

addresses.addEmailAddress(contactId, {
  email: "alice.smith@globex.example.com",
  useType: "WORK",
});

// Link contact to account
relationships.createRelationship({
  fromPartyId: accountId,
  toPartyId: contactId,
  relationshipType: "ACCOUNT_CONTACT",
  validFrom: new Date(),
});

// Assign the "CUSTOMER" role to the account
const roles = config.partyRolesFacade();
roles.assignRole(accountId, {
  roleType: "CUSTOMER",
  definingPolicy: "STANDARD_CUSTOMER_POLICY",
});
```

### Multi-tenant SaaS organization structure (companies, teams, members)

A SaaS platform nests teams inside a tenant company using organization units. Members are persons with roles scoped to each team.

```typescript
import { PartyConfiguration } from '@softwarearchetypes/party';

const config = PartyConfiguration.inMemory();
const parties = config.partiesFacade();
const relationships = config.partyRelationshipsFacade();
const roles = config.partyRolesFacade();

// Tenant (top-level organization)
const tenantResult = parties.createOrganization({ name: "NovaSoft Inc." });
const tenantId = tenantResult.getSuccess();

// Team (organization unit inside the tenant)
const teamResult = parties.createOrganizationUnit({
  name: "Platform Team",
  parentOrganizationId: tenantId,
});
const teamId = teamResult.getSuccess();

// Member
const memberResult = parties.createPerson({
  firstName: "Bob",
  lastName: "Chen",
});
const memberId = memberResult.getSuccess();

// Tenant membership
relationships.createRelationship({
  fromPartyId: tenantId,
  toPartyId: memberId,
  relationshipType: "TENANT_MEMBER",
  validFrom: new Date(),
});

// Team membership with an ADMIN role
relationships.createRelationship({
  fromPartyId: teamId,
  toPartyId: memberId,
  relationshipType: "TEAM_MEMBER",
  validFrom: new Date(),
});

roles.assignRole(memberId, {
  roleType: "TEAM_ADMIN",
  definingPolicy: "TEAM_ADMIN_POLICY",
  scopedToPartyId: teamId,
});
```

### Healthcare provider directory (doctors with specialties, hospital affiliations)

A provider directory tracks physicians as persons with capability scopes for specialties and links them to hospitals via affiliation relationships.

```typescript
import { PartyConfiguration } from '@softwarearchetypes/party';

const config = PartyConfiguration.inMemory();
const parties = config.partiesFacade();
const addresses = config.addressesFacade();
const capabilities = config.capabilitiesFacade();
const relationships = config.partyRelationshipsFacade();

// Hospital (organization)
const hospitalResult = parties.createOrganization({ name: "City General Hospital" });
const hospitalId = hospitalResult.getSuccess();

addresses.addGeoAddress(hospitalId, {
  street: "10 Medical Blvd",
  city: "Chicago",
  postalCode: "60601",
  country: "US",
  useType: "MAIN",
});

// Physician (person)
const doctorResult = parties.createPerson({
  firstName: "Dr. Maria",
  lastName: "Nowak",
  registeredIdentifiers: [
    { identifierType: "MEDICAL_LICENSE", value: "IL-123456", issuingAuthority: "IDFPR" },
  ],
});
const doctorId = doctorResult.getSuccess();

// Specialty as a capability with skill-level scope
capabilities.addCapability(doctorId, {
  capabilityType: "MEDICAL_SPECIALTY",
  name: "Cardiology",
  scopes: [
    { scopeType: "SKILL_LEVEL", level: "BOARD_CERTIFIED" },
    { scopeType: "PROTOCOL", protocol: "ACLS" },
  ],
});

// Hospital affiliation relationship
relationships.createRelationship({
  fromPartyId: hospitalId,
  toPartyId: doctorId,
  relationshipType: "MEDICAL_STAFF_AFFILIATION",
  validFrom: new Date("2020-07-01"),
});
```

### Marketplace seller/buyer profiles (Amazon/eBay seller verification)

A marketplace distinguishes verified sellers from buyers through roles and tracks seller capabilities such as shipping regions and product categories.

```typescript
import { PartyConfiguration } from '@softwarearchetypes/party';

const config = PartyConfiguration.inMemory();
const parties = config.partiesFacade();
const addresses = config.addressesFacade();
const capabilities = config.capabilitiesFacade();
const roles = config.partyRolesFacade();

// Seller (organization)
const sellerResult = parties.createOrganization({ name: "TechDeals Ltd" });
const sellerId = sellerResult.getSuccess();

addresses.addWebAddress(sellerId, {
  url: "https://techdeals.example.com",
  useType: "STOREFRONT",
});

// Verified seller role with a policy that encodes verification status
roles.assignRole(sellerId, {
  roleType: "VERIFIED_SELLER",
  definingPolicy: "SELLER_VERIFICATION_POLICY_V2",
  validFrom: new Date(),
});

// Shipping capability scoped to a geographic region
capabilities.addCapability(sellerId, {
  capabilityType: "SHIPPING",
  name: "EU Shipping",
  scopes: [
    { scopeType: "LOCATION", region: "EU" },
    { scopeType: "QUANTITY", maxUnitsPerOrder: 500 },
  ],
});

// Product category capability
capabilities.addCapability(sellerId, {
  capabilityType: "PRODUCT_CATEGORY",
  name: "Consumer Electronics",
  scopes: [{ scopeType: "PRODUCT", categoryCode: "CE" }],
});

// Buyer (person)
const buyerResult = parties.createPerson({ firstName: "Carlos", lastName: "Diaz" });
const buyerId = buyerResult.getSuccess();

addresses.addEmailAddress(buyerId, {
  email: "carlos.diaz@example.com",
  useType: "PERSONAL",
});

roles.assignRole(buyerId, {
  roleType: "BUYER",
  definingPolicy: "STANDARD_BUYER_POLICY",
});
```

### HR system (employees, departments, reporting relationships)

An HR system uses organization units for departments and person-to-unit relationships to express reporting lines. Roles encode job grades.

```typescript
import { PartyConfiguration } from '@softwarearchetypes/party';

const config = PartyConfiguration.inMemory();
const parties = config.partiesFacade();
const relationships = config.partyRelationshipsFacade();
const roles = config.partyRolesFacade();

// Company
const companyResult = parties.createOrganization({ name: "MegaCorp plc" });
const companyId = companyResult.getSuccess();

// Engineering department (organization unit)
const deptResult = parties.createOrganizationUnit({
  name: "Engineering",
  parentOrganizationId: companyId,
});
const deptId = deptResult.getSuccess();

// Manager
const managerResult = parties.createPerson({ firstName: "Sophie", lastName: "Turner" });
const managerId = managerResult.getSuccess();

roles.assignRole(managerId, {
  roleType: "EMPLOYEE",
  definingPolicy: "GRADE_L5_POLICY",
  validFrom: new Date("2019-03-01"),
});

relationships.createRelationship({
  fromPartyId: deptId,
  toPartyId: managerId,
  relationshipType: "DEPARTMENT_MEMBER",
  validFrom: new Date("2019-03-01"),
});

// Direct report
const reportResult = parties.createPerson({ firstName: "Liam", lastName: "Park" });
const reportId = reportResult.getSuccess();

roles.assignRole(reportId, {
  roleType: "EMPLOYEE",
  definingPolicy: "GRADE_L3_POLICY",
  validFrom: new Date("2022-06-15"),
});

relationships.createRelationship({
  fromPartyId: deptId,
  toPartyId: reportId,
  relationshipType: "DEPARTMENT_MEMBER",
  validFrom: new Date("2022-06-15"),
});

// Reporting line: Liam reports to Sophie
relationships.createRelationship({
  fromPartyId: managerId,
  toPartyId: reportId,
  relationshipType: "LINE_MANAGER",
  validFrom: new Date("2022-06-15"),
});
```

### Supply chain party management (suppliers, manufacturers, distributors)

A supply chain system tracks organizations with production and logistics capabilities scoped by location, quantity, and certification protocol.

```typescript
import { PartyConfiguration } from '@softwarearchetypes/party';

const config = PartyConfiguration.inMemory();
const parties = config.partiesFacade();
const addresses = config.addressesFacade();
const capabilities = config.capabilitiesFacade();
const relationships = config.partyRelationshipsFacade();
const roles = config.partyRolesFacade();

// Raw material supplier
const supplierResult = parties.createOrganization({ name: "RawMat GmbH" });
const supplierId = supplierResult.getSuccess();

roles.assignRole(supplierId, { roleType: "SUPPLIER", definingPolicy: "APPROVED_SUPPLIER_POLICY" });

capabilities.addCapability(supplierId, {
  capabilityType: "SUPPLY",
  name: "Steel Sheet Production",
  scopes: [
    { scopeType: "LOCATION", region: "DE" },
    { scopeType: "QUANTITY", monthlyCapacityTonnes: 2000 },
    { scopeType: "PROTOCOL", certification: "ISO_9001" },
  ],
});

// Manufacturer
const manufacturerResult = parties.createOrganization({ name: "PrecisionParts SA" });
const manufacturerId = manufacturerResult.getSuccess();

roles.assignRole(manufacturerId, {
  roleType: "MANUFACTURER",
  definingPolicy: "TIER1_MANUFACTURER_POLICY",
});

capabilities.addCapability(manufacturerId, {
  capabilityType: "MANUFACTURING",
  name: "CNC Machining",
  scopes: [
    { scopeType: "SKILL_LEVEL", level: "AEROSPACE_GRADE" },
    { scopeType: "PROTOCOL", certification: "AS9100" },
  ],
});

// Supplier -> Manufacturer sourcing relationship
relationships.createRelationship({
  fromPartyId: manufacturerId,
  toPartyId: supplierId,
  relationshipType: "SOURCING",
  validFrom: new Date("2023-01-01"),
});

// Distributor
const distributorResult = parties.createOrganization({ name: "LogiNet BV" });
const distributorId = distributorResult.getSuccess();

roles.assignRole(distributorId, {
  roleType: "DISTRIBUTOR",
  definingPolicy: "AUTHORIZED_DISTRIBUTOR_POLICY",
});

capabilities.addCapability(distributorId, {
  capabilityType: "DISTRIBUTION",
  name: "Last-Mile EU Delivery",
  scopes: [
    { scopeType: "LOCATION", region: "EU" },
    { scopeType: "TEMPORAL", leadTimeDays: 3 },
    { scopeType: "QUANTITY", maxShipmentsPerDay: 1000 },
  ],
});

addresses.addGeoAddress(distributorId, {
  street: "Havenstraat 42",
  city: "Rotterdam",
  postalCode: "3011 AA",
  country: "NL",
  useType: "WAREHOUSE",
});

// Manufacturer -> Distributor fulfilment relationship
relationships.createRelationship({
  fromPartyId: manufacturerId,
  toPartyId: distributorId,
  relationshipType: "FULFILMENT_PARTNER",
  validFrom: new Date("2023-06-01"),
});
```
