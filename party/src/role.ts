import { Preconditions, StringUtils } from '@softwarearchetypes/common';

export class Role {
    readonly name: string;

    constructor(name: string) {
        Preconditions.checkArgument(StringUtils.isNotBlank(name), 'Role name cannot be null');
        this.name = name;
    }

    static of(value: string): Role {
        return new Role(value);
    }

    asString(): string {
        return this.name;
    }
}
