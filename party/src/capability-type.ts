import { Preconditions, StringUtils } from '@softwarearchetypes/common';

export class CapabilityType {
    readonly name: string;
    constructor(name: string) {
        Preconditions.checkArgument(StringUtils.isNotBlank(name), 'Capability type name cannot be blank');
        this.name = name;
    }
    static of(name: string): CapabilityType { return new CapabilityType(name); }
    asString(): string { return this.name; }
}
