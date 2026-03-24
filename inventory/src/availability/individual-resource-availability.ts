import { Result, ResultFactory, Version } from '@softwarearchetypes/common';
import { Quantity, Unit } from '@softwarearchetypes/quantity';
import { IndividualBlockade } from './blockade';
import { BlockadeId } from './blockade-id';
import { IndividualLockRequest, LockRequest } from './lock-request';
import { OwnerId } from './owner-id';
import { ResourceAvailability } from './resource-availability';
import { ResourceAvailabilityId } from './resource-availability-id';
import { ResourceId } from './resource-id';
import { UnlockRequest } from './unlock-request';

export class IndividualResourceAvailability implements ResourceAvailability {
    private readonly _id: ResourceAvailabilityId;
    private readonly _resourceId: ResourceId;
    private readonly _now: () => Date;
    private _currentBlockade: IndividualBlockade | null;
    private readonly _version: Version;

    constructor(
        id: ResourceAvailabilityId,
        resourceId: ResourceId,
        now: () => Date,
        currentBlockade: IndividualBlockade | null,
        version: Version,
    ) {
        this._id = id;
        this._resourceId = resourceId;
        this._now = now;
        this._currentBlockade = currentBlockade;
        this._version = version;
    }

    static create(resourceId: ResourceId, now: () => Date = () => new Date()): IndividualResourceAvailability {
        return new IndividualResourceAvailability(
            ResourceAvailabilityId.random(), resourceId, now, null, Version.initial(),
        );
    }

    id(): ResourceAvailabilityId { return this._id; }
    resourceId(): ResourceId { return this._resourceId; }

    lock(request: LockRequest): Result<string, BlockadeId> {
        if (!(request instanceof IndividualLockRequest)) {
            return ResultFactory.failure(`Invalid request type. Expected IndividualLockRequest`);
        }
        const individualRequest = request as IndividualLockRequest;
        if (!individualRequest.resourceId.equals(this._resourceId)) {
            return ResultFactory.failure(`Resource ID mismatch. Expected: ${this._resourceId}, got: ${individualRequest.resourceId}`);
        }

        const now = this._now();
        if (!this.isAvailableFor(individualRequest.owner, now)) {
            return ResultFactory.failure(
                `Resource is not available - already blocked by: ${this._currentBlockade?.owner?.toString() ?? 'unknown'}`,
            );
        }

        const blockade = IndividualBlockade.create(individualRequest.owner, individualRequest.duration, now);
        this._currentBlockade = blockade;
        return ResultFactory.success(blockade.id);
    }

    unlock(request: UnlockRequest): Result<string, BlockadeId> {
        if (this._currentBlockade === null) {
            return ResultFactory.failure('Resource is not blocked');
        }
        if (!this._currentBlockade.id.equals(request.blockadeId)) {
            return ResultFactory.failure('Blockade ID mismatch');
        }
        if (!this._currentBlockade.isOwnedBy(request.requester)) {
            return ResultFactory.failure('Cannot unlock - not the owner of this blockade');
        }
        this._currentBlockade = null;
        return ResultFactory.success(request.blockadeId);
    }

    isAvailable(): boolean {
        const now = this._now();
        if (this._currentBlockade === null) return true;
        return this._currentBlockade.isExpired(now);
    }

    private isAvailableFor(requester: OwnerId, now: Date): boolean {
        if (this._currentBlockade === null) return true;
        if (this._currentBlockade.isExpired(now)) return true;
        return this._currentBlockade.isOwnedBy(requester);
    }

    availableQuantity(): Quantity {
        return this.isAvailable() ? Quantity.of(1, Unit.pieces()) : Quantity.of(0, Unit.pieces());
    }

    hasBlockade(blockadeId: BlockadeId): boolean {
        return this._currentBlockade !== null && this._currentBlockade.id.equals(blockadeId);
    }

    currentBlockade(): IndividualBlockade | null {
        return this._currentBlockade;
    }

    version(): Version { return this._version; }

    hasExpiredBlockades(): boolean {
        const now = this._now();
        return this._currentBlockade !== null && this._currentBlockade.isExpired(now);
    }

    releaseExpired(): BlockadeId[] {
        const now = this._now();
        if (this._currentBlockade !== null && this._currentBlockade.isExpired(now)) {
            const released = this._currentBlockade.id;
            this._currentBlockade = null;
            return [released];
        }
        return [];
    }
}
