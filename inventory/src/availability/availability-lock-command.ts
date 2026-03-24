import { LockRequest } from './lock-request';
import { ResourceAvailabilityId } from './resource-availability-id';

export class AvailabilityLockCommand {
    readonly availabilityId: ResourceAvailabilityId;
    readonly request: LockRequest;

    constructor(availabilityId: ResourceAvailabilityId, request: LockRequest) {
        if (!availabilityId) throw new Error('availabilityId cannot be null');
        if (!request) throw new Error('request cannot be null');
        this.availabilityId = availabilityId;
        this.request = request;
    }

    static of(availabilityId: ResourceAvailabilityId, request: LockRequest): AvailabilityLockCommand {
        return new AvailabilityLockCommand(availabilityId, request);
    }
}
