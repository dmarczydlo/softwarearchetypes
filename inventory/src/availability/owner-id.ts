import { randomUUID } from 'crypto';

export class OwnerId {
    readonly id: string | null;

    constructor(id: string | null) {
        this.id = id;
    }

    static none(): OwnerId {
        return new OwnerId(null);
    }

    static random(): OwnerId {
        return new OwnerId(randomUUID());
    }

    static of(id: string | null): OwnerId {
        if (id == null) {
            return OwnerId.none();
        }
        return new OwnerId(id);
    }

    isNone(): boolean {
        return this.id === null;
    }

    isPresent(): boolean {
        return this.id !== null;
    }

    equals(other: OwnerId): boolean {
        return this.id === other.id;
    }

    toString(): string {
        return this.id ?? 'none';
    }
}
