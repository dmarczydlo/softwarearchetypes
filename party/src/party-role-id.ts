import { Preconditions, StringUtils } from '@softwarearchetypes/common';
import { randomUUID } from 'crypto';

export class PartyRoleId {
    readonly value: string;

    constructor(value: string) {
        Preconditions.checkArgument(StringUtils.isNotBlank(value), 'PartyRoleId cannot be blank');
        this.value = value;
    }

    static random(): PartyRoleId {
        return new PartyRoleId(randomUUID());
    }

    static of(value: string): PartyRoleId {
        return new PartyRoleId(value);
    }

    asString(): string {
        return this.value;
    }
}
