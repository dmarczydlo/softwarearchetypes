import type { RegisteredIdentifier } from './registered-identifier.js';

export interface RegisteredIdentifierDefiningPolicy {
    canRegister(party: PartyLike, identifier: RegisteredIdentifier): boolean;
}

export interface PartyLike {
    readonly _partyType: string;
}

export class AllowAllIdentifiersPolicy implements RegisteredIdentifierDefiningPolicy {
    canRegister(_party: PartyLike, _identifier: RegisteredIdentifier): boolean {
        return true;
    }
}

export class PersonalIdentifiersOnlyForPersonsPolicy implements RegisteredIdentifierDefiningPolicy {
    private static readonly PERSONAL_IDENTIFIER_TYPES = new Set(['PERSONAL_IDENTIFICATION_NUMBER', 'PASSPORT']);

    canRegister(party: PartyLike, identifier: RegisteredIdentifier): boolean {
        if (PersonalIdentifiersOnlyForPersonsPolicy.PERSONAL_IDENTIFIER_TYPES.has(identifier.type())) {
            return party._partyType === 'PERSON';
        }
        return true;
    }
}

export class OrganizationalIdentifiersOnlyForOrganizationsPolicy implements RegisteredIdentifierDefiningPolicy {
    private static readonly ORGANIZATIONAL_IDENTIFIER_TYPES = new Set(['REGON', 'KRS']);

    canRegister(party: PartyLike, identifier: RegisteredIdentifier): boolean {
        if (OrganizationalIdentifiersOnlyForOrganizationsPolicy.ORGANIZATIONAL_IDENTIFIER_TYPES.has(identifier.type())) {
            return party._partyType === 'COMPANY' || party._partyType === 'ORGANIZATION_UNIT';
        }
        return true;
    }
}

export class CompositeIdentifierPolicy implements RegisteredIdentifierDefiningPolicy {
    private readonly policies: RegisteredIdentifierDefiningPolicy[];

    constructor(...policies: RegisteredIdentifierDefiningPolicy[]) {
        this.policies = policies;
    }

    canRegister(party: PartyLike, identifier: RegisteredIdentifier): boolean {
        for (const policy of this.policies) {
            if (!policy.canRegister(party, identifier)) return false;
        }
        return true;
    }
}

export const RegisteredIdentifierDefiningPolicies = {
    allowAll(): RegisteredIdentifierDefiningPolicy {
        return new AllowAllIdentifiersPolicy();
    },
    personalIdentifiersOnlyForPersons(): RegisteredIdentifierDefiningPolicy {
        return new PersonalIdentifiersOnlyForPersonsPolicy();
    },
    organizationalIdentifiersOnlyForOrganizations(): RegisteredIdentifierDefiningPolicy {
        return new OrganizationalIdentifiersOnlyForOrganizationsPolicy();
    },
    composite(...policies: RegisteredIdentifierDefiningPolicy[]): RegisteredIdentifierDefiningPolicy {
        return new CompositeIdentifierPolicy(...policies);
    },
    all(): RegisteredIdentifierDefiningPolicy {
        return new CompositeIdentifierPolicy(
            new PersonalIdentifiersOnlyForPersonsPolicy(),
            new OrganizationalIdentifiersOnlyForOrganizationsPolicy()
        );
    }
};
