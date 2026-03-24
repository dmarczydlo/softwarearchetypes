import { Result, ResultFactory } from '@softwarearchetypes/common';
import { BlockadeId } from './blockade-id';
import { LockDuration } from './lock-duration';
import { TemporalLockRequest } from './lock-request';
import { OwnerId } from './owner-id';
import { ResourceId } from './resource-id';
import { TemporalResourceAvailability } from './temporal-resource-availability';
import { TimeSlot } from './time-slot';
import { UnlockRequest } from './unlock-request';

export class TemporalResourceGroupedAvailability {
    private readonly _availabilities: TemporalResourceAvailability[];

    constructor(availabilities: TemporalResourceAvailability[]) {
        this._availabilities = availabilities;
    }

    static of(resourceId: ResourceId, slots: TimeSlot[], now: () => Date = () => new Date()): TemporalResourceGroupedAvailability {
        const availabilities = slots.map(slot => TemporalResourceAvailability.create(resourceId, slot, now));
        return new TemporalResourceGroupedAvailability(availabilities);
    }

    block(owner: OwnerId, duration: LockDuration): Result<string, BlockadeId[]> {
        if (!this.isEntirelyAvailable()) {
            return ResultFactory.failure('Not all slots are available');
        }

        const blockadeIds: BlockadeId[] = [];
        for (const availability of this._availabilities) {
            const request = TemporalLockRequest.of(
                availability.resourceId(), availability.slot(), owner, duration,
            );
            const result = availability.lock(request);
            if (result.isFailure()) {
                for (let i = 0; i < blockadeIds.length; i++) {
                    this._availabilities[i].unlock(UnlockRequest.of(owner, blockadeIds[i]));
                }
                return ResultFactory.failure(`Failed to lock slot: ${result.getFailure()}`);
            }
            blockadeIds.push(result.getSuccess());
        }

        return ResultFactory.success(blockadeIds);
    }

    release(owner: OwnerId, blockadeIds: BlockadeId[]): Result<string, BlockadeId[]> {
        if (blockadeIds.length !== this._availabilities.length) {
            return ResultFactory.failure('Blockade count mismatch');
        }

        const releasedIds: BlockadeId[] = [];
        for (let i = 0; i < this._availabilities.length; i++) {
            const availability = this._availabilities[i];
            const blockadeId = blockadeIds[i];
            const result = availability.unlock(UnlockRequest.of(owner, blockadeId));
            if (result.isFailure()) {
                return ResultFactory.failure(`Failed to release slot: ${result.getFailure()}`);
            }
            releasedIds.push(result.getSuccess());
        }

        return ResultFactory.success(releasedIds);
    }

    availabilities(): TemporalResourceAvailability[] {
        return this._availabilities;
    }

    getResourceId(): ResourceId | null {
        if (this._availabilities.length === 0) return null;
        return this._availabilities[0].resourceId();
    }

    size(): number {
        return this._availabilities.length;
    }

    blockedEntirelyBy(owner: OwnerId): boolean {
        return this._availabilities.every(ra => ra.blockedBy().equals(owner));
    }

    isEntirelyAvailable(): boolean {
        return this._availabilities.every(ra => ra.isAvailable());
    }

    hasNoSlots(): boolean {
        return this._availabilities.length === 0;
    }

    owners(): Set<string> {
        const ownerIds = new Set<string>();
        for (const ra of this._availabilities) {
            const owner = ra.blockedBy();
            ownerIds.add(owner.id ?? 'none');
        }
        return ownerIds;
    }

    findBlockedBy(owner: OwnerId): TemporalResourceAvailability[] {
        return this._availabilities.filter(ra => ra.blockedBy().equals(owner));
    }
}
