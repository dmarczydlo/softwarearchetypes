import { Preconditions } from '@softwarearchetypes/common';
import { CapabilityType } from './capability-type.js';
import { ScopeRequirement } from './scope-requirement.js';
import type { OperatingScope } from './operating-scope.js';

export class CapabilityRequirement {
    readonly requiredType: CapabilityType;
    readonly scopeRequirements: ScopeRequirement[];

    constructor(requiredType: CapabilityType, scopeRequirements: ScopeRequirement[]) {
        Preconditions.checkArgument(requiredType != null, 'Required type cannot be null');
        this.requiredType = requiredType;
        this.scopeRequirements = scopeRequirements ? [...scopeRequirements] : [];
    }

    static requiring(type: CapabilityType | string): CapabilityRequirementBuilder {
        const capType = typeof type === 'string' ? CapabilityType.of(type) : type;
        return new CapabilityRequirementBuilder(capType);
    }
}

export class CapabilityRequirementBuilder {
    private readonly type: CapabilityType;
    private readonly scopeRequirements: ScopeRequirement[] = [];
    constructor(type: CapabilityType) { this.type = type; }
    withScope(requiredScope: OperatingScope): CapabilityRequirementBuilder {
        this.scopeRequirements.push(new ScopeRequirement(requiredScope.scopeType(), requiredScope));
        return this;
    }
    build(): CapabilityRequirement {
        return new CapabilityRequirement(this.type, this.scopeRequirements);
    }
}
