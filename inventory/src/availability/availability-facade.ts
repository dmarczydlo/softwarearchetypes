import { Result, ResultFactory } from '@softwarearchetypes/common';
import { AvailabilityLockCommand } from './availability-lock-command';
import { BlockadeId } from './blockade-id';
import { IndividualLockRequest, PoolLockRequest, TemporalLockRequest } from './lock-request';
import { ResourceAvailability } from './resource-availability';
import { ResourceAvailabilityId } from './resource-availability-id';
import { ResourceAvailabilityRepository } from './resource-availability-repository';
import { ResourceId } from './resource-id';
import { TemporalResourceAvailability } from './temporal-resource-availability';
import { UnlockRequest } from './unlock-request';

export class AvailabilityFacade {
    private readonly repository: ResourceAvailabilityRepository;
    private readonly _now: () => Date;

    constructor(repository: ResourceAvailabilityRepository, now: () => Date = () => new Date()) {
        this.repository = repository;
        this._now = now;
    }

    register(availability: ResourceAvailability): Result<string, ResourceAvailabilityId> {
        this.repository.save(availability);
        return ResultFactory.success(availability.id());
    }

    lock(availabilityId: ResourceAvailabilityId, request: import('./lock-request').LockRequest): Result<string, BlockadeId> {
        const availability = this.repository.findById(availabilityId);
        if (availability === null) {
            return ResultFactory.failure(`Availability not found: ${availabilityId}`);
        }
        const result = availability.lock(request);
        if (result.isSuccess()) {
            this.repository.save(availability);
        }
        return result;
    }

    handle(command: AvailabilityLockCommand): Result<string, BlockadeId>;
    handle(request: UnlockRequest): Result<string, BlockadeId>;
    handle(arg: AvailabilityLockCommand | UnlockRequest): Result<string, BlockadeId> {
        if (arg instanceof AvailabilityLockCommand) {
            return this.lock(arg.availabilityId, arg.request);
        }
        // UnlockRequest
        const request = arg as UnlockRequest;
        const availability = this.repository.findByBlockadeId(request.blockadeId);
        if (availability === null) {
            return ResultFactory.failure(`No resource found with blockade: ${request.blockadeId}`);
        }
        const result = availability.unlock(request);
        if (result.isSuccess()) {
            this.repository.save(availability);
        }
        return result;
    }

    unlock(availabilityId: ResourceAvailabilityId, request: UnlockRequest): Result<string, BlockadeId> {
        const availability = this.repository.findById(availabilityId);
        if (availability === null) {
            return ResultFactory.failure(`Availability not found: ${availabilityId}`);
        }
        const result = availability.unlock(request);
        if (result.isSuccess()) {
            this.repository.save(availability);
        }
        return result;
    }

    isAvailable(availabilityId: ResourceAvailabilityId): boolean {
        const availability = this.repository.findById(availabilityId);
        if (availability === null) return false;
        return availability.isAvailable();
    }

    lockIndividual(resourceId: ResourceId, request: IndividualLockRequest): Result<string, BlockadeId> {
        const availabilities = this.repository.findByResourceId(resourceId);
        if (availabilities.length === 0) {
            return ResultFactory.failure(`No availability found for resource: ${resourceId}`);
        }
        return this.lock(availabilities[0].id(), request);
    }

    lockTemporal(resourceId: ResourceId, request: TemporalLockRequest): Result<string, BlockadeId> {
        const availabilities = this.repository.findByResourceId(resourceId);
        const matching = availabilities.find(a =>
            a instanceof TemporalResourceAvailability &&
            (a as TemporalResourceAvailability).slot().equals(request.slot),
        );
        if (!matching) {
            return ResultFactory.failure(
                `No temporal availability found for resource: ${resourceId} slot: ${request.slot}`,
            );
        }
        return this.lock(matching.id(), request);
    }

    lockPool(resourceId: ResourceId, request: PoolLockRequest): Result<string, BlockadeId> {
        const availabilities = this.repository.findByResourceId(resourceId);
        if (availabilities.length === 0) {
            return ResultFactory.failure(`No availability found for resource: ${resourceId}`);
        }
        return this.lock(availabilities[0].id(), request);
    }

    find(availabilityId: ResourceAvailabilityId): ResourceAvailability | null {
        return this.repository.findById(availabilityId);
    }

    findByResourceId(resourceId: ResourceId): ResourceAvailability[] {
        return this.repository.findByResourceId(resourceId);
    }

    findAvailable(): ResourceAvailability[] {
        return this.repository.findAll().filter(a => a.isAvailable());
    }

    findAvailableByResourceId(resourceId: ResourceId): ResourceAvailability[] {
        return this.repository.findByResourceId(resourceId).filter(a => a.isAvailable());
    }

    releaseExpired(): BlockadeId[] {
        const allReleased: BlockadeId[] = [];
        for (const availability of this.repository.findWithExpiredBlockades()) {
            allReleased.push(...availability.releaseExpired());
            this.repository.save(availability);
        }
        return allReleased;
    }
}
