import { BlockadeId } from './blockade-id';
import { ResourceAvailability } from './resource-availability';
import { ResourceAvailabilityId } from './resource-availability-id';
import { ResourceAvailabilityRepository } from './resource-availability-repository';
import { ResourceId } from './resource-id';

export class InMemoryResourceAvailabilityRepository implements ResourceAvailabilityRepository {
    private readonly storage = new Map<string, ResourceAvailability>();

    save(availability: ResourceAvailability): void {
        this.storage.set(availability.id().id, availability);
    }

    findById(id: ResourceAvailabilityId): ResourceAvailability | null {
        return this.storage.get(id.id) ?? null;
    }

    findByBlockadeId(blockadeId: BlockadeId): ResourceAvailability | null {
        for (const availability of this.storage.values()) {
            if (availability.hasBlockade(blockadeId)) {
                return availability;
            }
        }
        return null;
    }

    findByResourceId(resourceId: ResourceId): ResourceAvailability[] {
        return [...this.storage.values()].filter(a => a.resourceId().equals(resourceId));
    }

    findAll(): ResourceAvailability[] {
        return [...this.storage.values()];
    }

    findWithExpiredBlockades(): ResourceAvailability[] {
        return [...this.storage.values()].filter(a => a.hasExpiredBlockades());
    }

    delete(id: ResourceAvailabilityId): void {
        this.storage.delete(id.id);
    }
}
