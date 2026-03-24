import { Preconditions } from '@softwarearchetypes/common';
import { CapabilityId } from './capability-id.js';
import { PartyId } from './party-id.js';
import { CapabilityType } from './capability-type.js';
import type { OperatingScope } from './operating-scope.js';
import { Validity } from './validity.js';
import type { CapabilityRequirement } from './capability-requirement.js';
import type { ScopeRequirement } from './scope-requirement.js';

export class Capability {
    readonly id: CapabilityId;
    readonly partyId: PartyId;
    readonly type: CapabilityType;
    readonly scopes: OperatingScope[];
    readonly validity: Validity;

    private constructor(id: CapabilityId, partyId: PartyId, type: CapabilityType, scopes: OperatingScope[], validity: Validity) {
        this.id = id;
        this.partyId = partyId;
        this.type = type;
        this.scopes = [...scopes];
        this.validity = validity;
    }

    static forParty(partyId: PartyId): CapabilityBuilder {
        return new CapabilityBuilder(partyId);
    }

    isCurrentlyValid(): boolean { return this.validity.isCurrentlyValid(); }
    isValidAt(instant: Date): boolean { return this.validity.isValidAt(instant); }

    scope<T extends OperatingScope>(scopeClass: new (...args: never[]) => T): T | null {
        const found = this.scopes.find(s => s instanceof scopeClass);
        return found ? found as T : null;
    }

    hasScope(scopeClass: new (...args: never[]) => OperatingScope): boolean {
        return this.scopes.some(s => s instanceof scopeClass);
    }

    satisfies(requirement: CapabilityRequirement): boolean {
        if (!this.isCurrentlyValid()) return false;
        if (this.type.name !== requirement.requiredType.name) return false;
        for (const scopeReq of requirement.scopeRequirements) {
            if (!this.satisfiesScopeRequirement(scopeReq)) return false;
        }
        return true;
    }

    satisfiesAt(requirement: CapabilityRequirement, at: Date): boolean {
        if (!this.isValidAt(at)) return false;
        if (this.type.name !== requirement.requiredType.name) return false;
        for (const scopeReq of requirement.scopeRequirements) {
            if (!this.satisfiesScopeRequirement(scopeReq)) return false;
        }
        return true;
    }

    private satisfiesScopeRequirement(requirement: ScopeRequirement): boolean {
        return this.scopes.filter(s => s.scopeType() === requirement.scopeType).some(s => s.satisfies(requirement.requiredScope));
    }

    static _create(id: CapabilityId, partyId: PartyId, type: CapabilityType, scopes: OperatingScope[], validity: Validity): Capability {
        return new Capability(id, partyId, type, scopes, validity);
    }
}

export class CapabilityBuilder {
    private readonly partyId: PartyId;
    private _type: CapabilityType | null = null;
    private readonly _scopes: OperatingScope[] = [];
    private _validity: Validity = Validity.ALWAYS;

    constructor(partyId: PartyId) { this.partyId = partyId; }

    type(type: CapabilityType | string): CapabilityBuilder {
        this._type = typeof type === 'string' ? CapabilityType.of(type) : type;
        return this;
    }
    withScope(scope: OperatingScope): CapabilityBuilder { this._scopes.push(scope); return this; }
    validUntil(validTo: Date): CapabilityBuilder { this._validity = Validity.until(validTo); return this; }
    validFrom(validFrom: Date): CapabilityBuilder { this._validity = Validity.from(validFrom); return this; }
    validBetween(validFrom: Date, validTo: Date): CapabilityBuilder { this._validity = Validity.between(validFrom, validTo); return this; }
    validity(validity: Validity): CapabilityBuilder { this._validity = validity; return this; }

    build(): Capability {
        Preconditions.checkArgument(this._type != null, 'Capability type is required');
        return Capability._create(CapabilityId.random(), this.partyId, this._type!, this._scopes, this._validity);
    }
}
