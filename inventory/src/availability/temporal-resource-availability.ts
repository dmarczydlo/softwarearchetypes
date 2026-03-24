import { Result, ResultFactory, Version } from '@softwarearchetypes/common';
import { Quantity, Unit } from '@softwarearchetypes/quantity';
import { TemporalBlockade } from './blockade';
import { BlockadeId } from './blockade-id';
import { LockRequest, TemporalLockRequest } from './lock-request';
import { OwnerId } from './owner-id';
import { ResourceAvailability } from './resource-availability';
import { ResourceAvailabilityId } from './resource-availability-id';
import { ResourceId } from './resource-id';
import { TimeSlot } from './time-slot';
import { UnlockRequest } from './unlock-request';

export class TemporalResourceAvailability implements ResourceAvailability {
    private readonly _id: ResourceAvailabilityId;
    private readonly _resourceId: ResourceId;
    private readonly _slot: TimeSlot;
    private readonly _now: () => Date;
    private _blockade: TemporalBlockade | null;
    private readonly _version: Version;

    constructor(
        id: ResourceAvailabilityId,
        resourceId: ResourceId,
        slot: TimeSlot,
        now: () => Date,
        blockade: TemporalBlockade | null,
        version: Version,
    ) {
        this._id = id;
        this._resourceId = resourceId;
        this._slot = slot;
        this._now = now;
        this._blockade = blockade;
        this._version = version;
    }

    static create(resourceId: ResourceId, slot: TimeSlot, now: () => Date = () => new Date()): TemporalResourceAvailability {
        return new TemporalResourceAvailability(
            ResourceAvailabilityId.random(), resourceId, slot, now, null, Version.initial(),
        );
    }

    id(): ResourceAvailabilityId { return this._id; }
    resourceId(): ResourceId { return this._resourceId; }
    slot(): TimeSlot { return this._slot; }

    lock(request: LockRequest): Result<string, BlockadeId> {
        if (!(request instanceof TemporalLockRequest)) {
            return ResultFactory.failure(`Invalid request type. Expected TemporalLockRequest`);
        }
        const temporalRequest = request as TemporalLockRequest;
        if (!temporalRequest.resourceId.equals(this._resourceId)) {
            return ResultFactory.failure(`Resource ID mismatch. Expected: ${this._resourceId}, got: ${temporalRequest.resourceId}`);
        }

        const requestedSlot = temporalRequest.slot;
        if (!this._slot.equals(requestedSlot) && !this._slot.overlaps(requestedSlot)) {
            return ResultFactory.failure('Requested slot does not match this availability slot');
        }

        const now = this._now();
        if (!this.isAvailableFor(temporalRequest.owner, now)) {
            return ResultFactory.failure(
                `Slot is not available - already blocked by: ${this._blockade?.owner?.toString() ?? 'unknown'}`,
            );
        }

        const newBlockade = TemporalBlockade.create(temporalRequest.owner, temporalRequest.duration, now);
        this._blockade = newBlockade;
        return ResultFactory.success(newBlockade.id);
    }

    unlock(request: UnlockRequest): Result<string, BlockadeId> {
        if (this._blockade === null) {
            return ResultFactory.failure('Slot is not blocked');
        }
        if (!this._blockade.id.equals(request.blockadeId)) {
            return ResultFactory.failure('Blockade ID mismatch');
        }
        if (!this._blockade.isOwnedBy(request.requester)) {
            return ResultFactory.failure('Cannot unlock - not the owner of this blockade');
        }
        this._blockade = null;
        return ResultFactory.success(request.blockadeId);
    }

    isAvailable(): boolean {
        const now = this._now();
        return this._blockade === null || this._blockade.isExpired(now);
    }

    isAvailableFor(requester: OwnerId, now: Date): boolean {
        if (this._blockade === null) return true;
        if (this._blockade.isExpired(now)) return true;
        return this._blockade.isOwnedBy(requester);
    }

    availableQuantity(): Quantity {
        return this.isAvailable() ? Quantity.of(1, Unit.pieces()) : Quantity.of(0, Unit.pieces());
    }

    hasBlockade(blockadeId: BlockadeId): boolean {
        return this._blockade !== null && this._blockade.id.equals(blockadeId);
    }

    blockade(): TemporalBlockade | null { return this._blockade; }

    blockedBy(): OwnerId {
        return this._blockade !== null ? this._blockade.owner : OwnerId.none();
    }

    version(): Version { return this._version; }

    hasExpiredBlockades(): boolean {
        const now = this._now();
        return this._blockade !== null && this._blockade.isExpired(now);
    }

    releaseExpired(): BlockadeId[] {
        const now = this._now();
        if (this._blockade !== null && this._blockade.isExpired(now)) {
            const released = this._blockade.id;
            this._blockade = null;
            return [released];
        }
        return [];
    }
}
