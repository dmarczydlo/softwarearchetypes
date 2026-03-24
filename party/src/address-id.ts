import { Preconditions } from '@softwarearchetypes/common';
import { randomUUID } from 'crypto';

export class AddressId {
    readonly value: string;

    constructor(value: string) {
        Preconditions.checkNotNull(value, 'Address ID needs to be valid UUID');
        this.value = value;
    }

    static of(value: string): AddressId {
        return new AddressId(value);
    }

    static random(): AddressId {
        return AddressId.of(randomUUID());
    }

    asString(): string {
        return this.value;
    }
}
