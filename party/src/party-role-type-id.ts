import { Preconditions, StringUtils } from '@softwarearchetypes/common';
import { randomUUID } from 'crypto';

export class PartyRoleTypeId {
    readonly value: string;

    constructor(value: string) {
        Preconditions.checkArgument(StringUtils.isNotBlank(value), 'PartyRoleTypeId cannot be blank');
        this.value = value;
    }

    static random(): PartyRoleTypeId {
        return new PartyRoleTypeId(randomUUID());
    }

    static of(value: string): PartyRoleTypeId {
        return new PartyRoleTypeId(value);
    }

    asString(): string {
        return this.value;
    }
}
