import { randomUUID } from 'crypto';

export class ResourceAvailabilityId {
    readonly id: string;

    constructor(id: string) {
        if (id == null) {
            throw new Error('ResourceAvailabilityId cannot be null');
        }
        this.id = id;
    }

    static random(): ResourceAvailabilityId {
        return new ResourceAvailabilityId(randomUUID());
    }

    static of(id: string): ResourceAvailabilityId {
        return new ResourceAvailabilityId(id);
    }

    equals(other: ResourceAvailabilityId): boolean {
        return this.id === other.id;
    }

    toString(): string {
        return this.id;
    }
}
