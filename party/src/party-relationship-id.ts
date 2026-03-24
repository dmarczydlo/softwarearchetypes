import { Preconditions } from '@softwarearchetypes/common';
import { randomUUID } from 'crypto';

export class PartyRelationshipId {
    readonly value: string;

    constructor(value: string) {
        Preconditions.checkArgument(value != null, 'Party relationship id value cannot be null');
        this.value = value;
    }

    asString(): string {
        return this.value;
    }

    static of(value: string): PartyRelationshipId {
        return new PartyRelationshipId(value);
    }

    static random(): PartyRelationshipId {
        return PartyRelationshipId.of(randomUUID());
    }
}
