import { Preconditions, StringUtils } from '@softwarearchetypes/common';
import { randomUUID } from 'crypto';

export class CapabilityId {
    readonly value: string;

    constructor(value: string) {
        Preconditions.checkArgument(StringUtils.isNotBlank(value), 'CapabilityId cannot be blank');
        this.value = value;
    }

    static random(): CapabilityId {
        return new CapabilityId(randomUUID());
    }

    static of(value: string): CapabilityId {
        return new CapabilityId(value);
    }

    asString(): string {
        return this.value;
    }
}
