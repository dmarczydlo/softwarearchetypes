import { randomUUID } from 'crypto';

export class ResourceId {
    readonly id: string | null;

    constructor(id: string | null) {
        this.id = id;
    }

    static none(): ResourceId {
        return new ResourceId(null);
    }

    static random(): ResourceId {
        return new ResourceId(randomUUID());
    }

    static of(id: string): ResourceId {
        if (id == null) {
            return ResourceId.none();
        }
        return new ResourceId(id);
    }

    isNone(): boolean {
        return this.id === null;
    }

    equals(other: ResourceId): boolean {
        return this.id === other.id;
    }

    toString(): string {
        return this.id ?? 'none';
    }
}
