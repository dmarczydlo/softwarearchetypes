import { Preconditions, StringUtils } from '@softwarearchetypes/common';

export interface OperatingScope {
    scopeType(): string;
    satisfies(requirement: OperatingScope): boolean;
}

export class LocationScope implements OperatingScope {
    readonly locations: Set<string>;
    constructor(locations: Set<string>) {
        Preconditions.checkArgument(locations != null && locations.size > 0, 'Locations cannot be empty');
        this.locations = new Set(locations);
    }
    static of(...locations: string[]): LocationScope { return new LocationScope(new Set(locations)); }
    scopeType(): string { return 'LOCATION'; }
    satisfies(requirement: OperatingScope): boolean {
        if (!(requirement instanceof LocationScope)) return false;
        for (const loc of requirement.locations) { if (!this.locations.has(loc)) return false; }
        return true;
    }
    includes(location: string): boolean { return this.locations.has(location); }
}

export class TemporalScope implements OperatingScope {
    constructor(public readonly days: Set<number>, public readonly startTime: string, public readonly endTime: string) {
        Preconditions.checkArgument(days != null && days.size > 0, 'Days cannot be empty');
    }
    static always(): TemporalScope { return new TemporalScope(new Set([0,1,2,3,4,5,6]), '00:00', '23:59'); }
    static workingHours(): TemporalScope { return new TemporalScope(new Set([1,2,3,4,5]), '08:00', '18:00'); }
    scopeType(): string { return 'TEMPORAL'; }
    satisfies(requirement: OperatingScope): boolean {
        if (!(requirement instanceof TemporalScope)) return false;
        for (const d of requirement.days) { if (!this.days.has(d)) return false; }
        return this.startTime <= requirement.startTime && this.endTime >= requirement.endTime;
    }
}

export class QuantityScope implements OperatingScope {
    constructor(public readonly maxQuantity: number, public readonly period: string) {
        Preconditions.checkArgument(maxQuantity > 0 || period === 'UNLIMITED', 'Max quantity must be positive');
    }
    static unlimited(): QuantityScope { return new QuantityScope(Number.MAX_SAFE_INTEGER, 'UNLIMITED'); }
    static maxPerDay(max: number): QuantityScope { return new QuantityScope(max, 'PER_DAY'); }
    scopeType(): string { return 'QUANTITY'; }
    satisfies(requirement: OperatingScope): boolean {
        if (!(requirement instanceof QuantityScope)) return false;
        if (this.period === 'UNLIMITED') return true;
        if (requirement.period === 'UNLIMITED') return true;
        return this.period === requirement.period && this.maxQuantity >= requirement.maxQuantity;
    }
}

export class SkillLevelScope implements OperatingScope {
    static readonly JUNIOR = new SkillLevelScope('Junior', 1);
    static readonly MID = new SkillLevelScope('Mid', 2);
    static readonly SENIOR = new SkillLevelScope('Senior', 3);
    static readonly EXPERT = new SkillLevelScope('Expert', 4);
    constructor(public readonly level: string, public readonly rank: number) {
        Preconditions.checkArgument(StringUtils.isNotBlank(level), 'Skill level cannot be blank');
        Preconditions.checkArgument(rank > 0, 'Rank must be positive');
    }
    static of(level: string, rank?: number): SkillLevelScope {
        if (rank !== undefined) return new SkillLevelScope(level, rank);
        switch (level.toLowerCase()) {
            case 'junior': return SkillLevelScope.JUNIOR;
            case 'mid': return SkillLevelScope.MID;
            case 'senior': return SkillLevelScope.SENIOR;
            case 'expert': case 'advanced': return SkillLevelScope.EXPERT;
            default: return new SkillLevelScope(level, 1);
        }
    }
    scopeType(): string { return 'SKILL_LEVEL'; }
    satisfies(requirement: OperatingScope): boolean {
        if (!(requirement instanceof SkillLevelScope)) return false;
        return this.rank >= requirement.rank;
    }
    isAtLeast(other: SkillLevelScope): boolean { return this.rank >= other.rank; }
}

export class ProtocolScope implements OperatingScope {
    readonly protocols: Set<string>;
    constructor(protocols: Set<string>) {
        Preconditions.checkArgument(protocols != null && protocols.size > 0, 'Protocols cannot be empty');
        this.protocols = new Set(protocols);
    }
    static of(...protocols: string[]): ProtocolScope { return new ProtocolScope(new Set(protocols)); }
    scopeType(): string { return 'PROTOCOL'; }
    satisfies(requirement: OperatingScope): boolean {
        if (!(requirement instanceof ProtocolScope)) return false;
        for (const p of requirement.protocols) { if (!this.protocols.has(p)) return false; }
        return true;
    }
}

export class ProductScope implements OperatingScope {
    readonly products: Set<string>;
    constructor(products: Set<string>) {
        Preconditions.checkArgument(products != null && products.size > 0, 'Products cannot be empty');
        this.products = new Set(products);
    }
    static of(...products: string[]): ProductScope { return new ProductScope(new Set(products)); }
    scopeType(): string { return 'PRODUCT'; }
    satisfies(requirement: OperatingScope): boolean {
        if (!(requirement instanceof ProductScope)) return false;
        for (const p of requirement.products) { if (!this.products.has(p)) return false; }
        return true;
    }
}

export class ResourceScope implements OperatingScope {
    readonly resources: Set<string>;
    constructor(resources: Set<string>) {
        Preconditions.checkArgument(resources != null && resources.size > 0, 'Resources cannot be empty');
        this.resources = new Set(resources);
    }
    static of(...resources: string[]): ResourceScope { return new ResourceScope(new Set(resources)); }
    scopeType(): string { return 'RESOURCE'; }
    satisfies(requirement: OperatingScope): boolean {
        if (!(requirement instanceof ResourceScope)) return false;
        for (const r of requirement.resources) { if (!this.resources.has(r)) return false; }
        return true;
    }
}
