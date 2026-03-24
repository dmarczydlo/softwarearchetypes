import { randomUUID } from 'crypto';

export class AccountId {
    readonly uuid: string;

    constructor(uuid: string) {
        this.uuid = uuid;
    }

    static generate(): AccountId {
        return new AccountId(randomUUID());
    }

    static of(uuid: string): AccountId {
        return new AccountId(uuid);
    }

    toString(): string {
        return this.uuid;
    }
}
