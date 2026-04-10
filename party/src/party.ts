import { Preconditions } from '@softwarearchetypes/common';
import { ResultFactory, type Result } from '@softwarearchetypes/common';
import { Version } from '@softwarearchetypes/common';
import { PartyId } from './party-id.js';
import { Role } from './role.js';
import type { RegisteredIdentifier } from './registered-identifier.js';
import type { PartyRelatedEvent } from './events/party-related-event.js';
import type { PublishedEvent } from './events/published-event.js';
import type { PartyRegistered } from './events/party-registered.js';
import { RoleAdded } from './events/role-added.js';
import { RoleAdditionSkipped } from './events/role-addition-skipped.js';
import { RoleRemoved } from './events/role-removed.js';
import { RoleRemovalSkipped } from './events/role-removal-skipped.js';
import { RegisteredIdentifierAdded } from './events/registered-identifier-added.js';
import { RegisteredIdentifierAdditionSkipped } from './events/registered-identifier-addition-skipped.js';
import { RegisteredIdentifierRemoved } from './events/registered-identifier-removed.js';
import { RegisteredIdentifierRemovalSkipped } from './events/registered-identifier-removal-skipped.js';
import type { RegisteredIdentifierDefiningPolicy } from './registered-identifier-defining-policy.js';
import { RegisteredIdentifierDefiningPolicies } from './registered-identifier-defining-policy.js';
import type { PartyRoleDefiningPolicy } from './party-role-defining-policy.js';
import { PartyRoleDefiningPolicies } from './party-role-defining-policy.js';

export abstract class Party {
    readonly _partyType: string;
    private readonly _partyId: PartyId;
    private readonly _roles: Role[];
    private readonly _registeredIdentifiers: Set<RegisteredIdentifier>;
    private readonly _events: PartyRelatedEvent[] = [];
    private readonly _version: Version;
    private readonly _identifierPolicy: RegisteredIdentifierDefiningPolicy;
    private readonly _roleDefiningPolicy: PartyRoleDefiningPolicy;

    protected constructor(
        partyType: string,
        partyId: PartyId,
        roles: Set<Role>,
        registeredIdentifiers: Set<RegisteredIdentifier>,
        version: Version,
        identifierPolicy?: RegisteredIdentifierDefiningPolicy,
        roleDefiningPolicy?: PartyRoleDefiningPolicy
    ) {
        Preconditions.checkArgument(partyId != null, 'Party Id cannot be null');
        Preconditions.checkArgument(roles != null, 'Roles cannot be null');
        Preconditions.checkArgument(registeredIdentifiers != null, 'Registered identifiers cannot be null');
        Preconditions.checkArgument(version != null, 'Version cannot be null');

        this._partyType = partyType;
        this._partyId = partyId;
        this._roles = [...roles];
        this._version = version;
        this._identifierPolicy = identifierPolicy ?? RegisteredIdentifierDefiningPolicies.all();
        this._roleDefiningPolicy = roleDefiningPolicy ?? PartyRoleDefiningPolicies.alwaysAllow();

        // Validate all identifiers against policy
        for (const identifier of registeredIdentifiers) {
            if (!this._identifierPolicy.canRegister(this, identifier)) {
                throw new Error('Registered identifier ' + identifier.type() + ' is not allowed for this party type');
            }
        }
        this._registeredIdentifiers = new Set(registeredIdentifiers);
    }

    add(roleOrIdentifier: Role | RegisteredIdentifier): Result<string, Party> {
        if (roleOrIdentifier instanceof Role) {
            return this.addRole(roleOrIdentifier);
        }
        return this.addIdentifier(roleOrIdentifier as RegisteredIdentifier);
    }

    private addRole(role: Role): Result<string, Party> {
        Preconditions.checkNotNull(role, 'Role cannot be null');
        if (this._roleDefiningPolicy.canDefineFor(this, role)) {
            if (!this._roles.some(r => r.asString() === role.asString())) {
                this._roles.push(role);
                this._events.push(new RoleAdded(this._partyId.asString(), role.asString()));
            } else {
                this._events.push(RoleAdditionSkipped.dueToDuplicationFor(this._partyId.asString(), role.asString()));
            }
            return ResultFactory.success(this);
        } else {
            return ResultFactory.failure('POLICY_NOT_MET');
        }
    }

    private addIdentifier(identifier: RegisteredIdentifier): Result<string, Party> {
        Preconditions.checkNotNull(identifier, 'Registered identifier cannot be null');
        if (!this.canRegister(identifier)) {
            return ResultFactory.failure('IDENTIFIER_NOT_ALLOWED_FOR_PARTY_TYPE');
        }
        const found = [...this._registeredIdentifiers].some(i => i.type() === identifier.type() && i.asString() === identifier.asString());
        if (!found) {
            this._registeredIdentifiers.add(identifier);
            this._events.push(new RegisteredIdentifierAdded(this._partyId.asString(), identifier.type(), identifier.asString()));
        } else {
            this._events.push(RegisteredIdentifierAdditionSkipped.dueToDataDuplicationFor(this._partyId.asString(), identifier.type(), identifier.asString()));
        }
        return ResultFactory.success(this);
    }

    remove(roleOrIdentifier: Role | RegisteredIdentifier): Result<string, Party> {
        if (roleOrIdentifier instanceof Role) {
            return this.removeRole(roleOrIdentifier);
        }
        return this.removeIdentifier(roleOrIdentifier as RegisteredIdentifier);
    }

    private removeRole(role: Role): Result<string, Party> {
        Preconditions.checkNotNull(role, 'Role cannot be null');
        const index = this._roles.findIndex(r => r.asString() === role.asString());
        if (index >= 0) {
            this._roles.splice(index, 1);
            this._events.push(new RoleRemoved(this._partyId.asString(), role.asString()));
        } else {
            this._events.push(RoleRemovalSkipped.dueToMissingRoleFor(this._partyId.asString(), role.asString()));
        }
        return ResultFactory.success(this);
    }

    private removeIdentifier(identifier: RegisteredIdentifier): Result<string, Party> {
        Preconditions.checkNotNull(identifier, 'Registered identifier cannot be null');
        const found = [...this._registeredIdentifiers].find(i => i.type() === identifier.type() && i.asString() === identifier.asString());
        if (found) {
            this._registeredIdentifiers.delete(found);
            this._events.push(new RegisteredIdentifierRemoved(this._partyId.asString(), identifier.type(), identifier.asString()));
        } else {
            this._events.push(RegisteredIdentifierRemovalSkipped.dueToMissingIdentifierFor(this._partyId.asString(), identifier.type(), identifier.asString()));
        }
        return ResultFactory.success(this);
    }

    canRegister(identifier: RegisteredIdentifier): boolean {
        return this._identifierPolicy.canRegister(this, identifier);
    }

    id(): PartyId { return this._partyId; }

    roles(): Set<Role> {
        return new Set(this._roles);
    }

    version(): Version { return this._version; }

    registeredIdentifiers(): Set<RegisteredIdentifier> {
        return new Set(this._registeredIdentifiers);
    }

    events(): PartyRelatedEvent[] { return [...this._events]; }

    publishedEvents(): PublishedEvent[] {
        return this._events.filter((e): e is PartyRelatedEvent & PublishedEvent => '_publishedEvent' in e);
    }

    abstract toPartyRegisteredEvent(): PartyRegistered;

    register(event: PartyRelatedEvent): void {
        this._events.push(event);
    }
}
