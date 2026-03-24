import { BlockadeId } from './blockade-id';
import { ResourceAvailability } from './resource-availability';
import { ResourceAvailabilityId } from './resource-availability-id';
import { ResourceId } from './resource-id';

export interface ResourceAvailabilityRepository {
    save(availability: ResourceAvailability): void;
    findById(id: ResourceAvailabilityId): ResourceAvailability | null;
    findByBlockadeId(blockadeId: BlockadeId): ResourceAvailability | null;
    findByResourceId(resourceId: ResourceId): ResourceAvailability[];
    findAll(): ResourceAvailability[];
    findWithExpiredBlockades(): ResourceAvailability[];
    delete(id: ResourceAvailabilityId): void;
}
