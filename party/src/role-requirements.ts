import { Preconditions } from '@softwarearchetypes/common';
import { Role } from './role.js';
import type { CapabilityRequirement } from './capability-requirement.js';
import type { Capability } from './capability.js';

export class RoleRequirements {
    readonly role: Role;
    readonly capabilityRequirements: CapabilityRequirement[];

    constructor(role: Role, capabilityRequirements: CapabilityRequirement[]) {
        Preconditions.checkArgument(role != null, 'Role cannot be null');
        this.role = role;
        this.capabilityRequirements = capabilityRequirements ? [...capabilityRequirements] : [];
    }

    static forRole(role: Role | string): RoleRequirementsBuilder {
        const r = typeof role === 'string' ? Role.of(role) : role;
        return new RoleRequirementsBuilder(r);
    }

    isSatisfiedBy(capabilities: Capability[]): boolean {
        for (const requirement of this.capabilityRequirements) {
            if (!capabilities.some(cap => cap.satisfies(requirement))) return false;
        }
        return true;
    }

    findMissing(capabilities: Capability[]): CapabilityRequirement[] {
        return this.capabilityRequirements.filter(req => !capabilities.some(cap => cap.satisfies(req)));
    }
}

class RoleRequirementsBuilder {
    private readonly role: Role;
    private readonly requirements: CapabilityRequirement[] = [];
    constructor(role: Role) { this.role = role; }
    requireCapability(requirement: CapabilityRequirement): RoleRequirementsBuilder {
        this.requirements.push(requirement);
        return this;
    }
    build(): RoleRequirements {
        return new RoleRequirements(this.role, this.requirements);
    }
}
