import { Preconditions } from '@softwarearchetypes/common';
import { randomUUID } from 'crypto';

export class PartyId {
    readonly value: string;

    constructor(value: string) {
        Preconditions.checkArgument(value != null, 'Party Id value cannot be null');
        this.value = value;
    }

    asString(): string {
        return this.value;
    }

    static of(value: string): PartyId {
        return new PartyId(value);
    }

    static random(): PartyId {
        return PartyId.of(randomUUID());
    }
}
