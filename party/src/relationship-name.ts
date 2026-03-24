import { Preconditions, StringUtils } from '@softwarearchetypes/common';

export class RelationshipName {
    readonly value: string;

    constructor(value: string) {
        Preconditions.checkArgument(StringUtils.isNotBlank(value), 'Relationship name cannot be null');
        this.value = value;
    }

    static of(value: string): RelationshipName {
        return new RelationshipName(value);
    }

    asString(): string {
        return this.value;
    }
}
