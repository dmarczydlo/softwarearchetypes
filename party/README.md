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

```bash
npm install @softwarearchetypes/party
```

## Dependencies

- `@softwarearchetypes/common`

## Quick example

```typescript
import { PartyConfiguration } from '@softwarearchetypes/party';

const config = PartyConfiguration.inMemory();
const parties = config.partiesFacade();
const addresses = config.addressesFacade();

// Create a person
const personResult = parties.createPerson({
  firstName: "Jan",
  lastName: "Kowalski",
});

// Add an email address
addresses.addEmailAddress(personResult.getSuccess(), {
  email: "jan@example.com",
  useType: "WORK",
});
```
