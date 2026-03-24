import { Result, ResultFactory, Version } from '@softwarearchetypes/common';
import { Quantity, Unit } from '@softwarearchetypes/quantity';
import { PoolBlockade } from './blockade';
import { BlockadeId } from './blockade-id';
import { LockRequest, PoolLockRequest } from './lock-request';
import { ResourceAvailability } from './resource-availability';
import { ResourceAvailabilityId } from './resource-availability-id';
import { ResourceId } from './resource-id';
import { UnlockRequest } from './unlock-request';

export class PoolResourceAvailability implements ResourceAvailability {
    private readonly _id: ResourceAvailabilityId;
    private readonly _resourceId: ResourceId;
    private readonly _now: () => Date;
    private readonly _totalCapacity: Quantity;
    private _withdrawn: Quantity;
    private readonly _blockades: PoolBlockade[];
    private readonly _version: Version;

    constructor(
        id: ResourceAvailabilityId,
        resourceId: ResourceId,
        totalCapacity: Quantity,
        now: () => Date,
        withdrawn: Quantity,
        blockades: PoolBlockade[],
        version: Version,
    ) {
        this._id = id;
        this._resourceId = resourceId;
        this._totalCapacity = totalCapacity;
        this._now = now;
        this._withdrawn = withdrawn;
        this._blockades = [...blockades];
        this._version = version;
    }

    static create(resourceId: ResourceId, totalCapacity: Quantity, now: () => Date = () => new Date()): PoolResourceAvailability {
        return new PoolResourceAvailability(
            ResourceAvailabilityId.random(), resourceId, totalCapacity, now,
            Quantity.of(0, totalCapacity.unit), [], Version.initial(),
        );
    }

    id(): ResourceAvailabilityId { return this._id; }
    resourceId(): ResourceId { return this._resourceId; }

    lock(request: LockRequest): Result<string, BlockadeId> {
        if (!(request instanceof PoolLockRequest)) {
            return ResultFactory.failure(`Invalid request type. Expected PoolLockRequest`);
        }
        const poolRequest = request as PoolLockRequest;
        if (!poolRequest.resourceId.equals(this._resourceId)) {
            return ResultFactory.failure(`Resource ID mismatch. Expected: ${this._resourceId}, got: ${poolRequest.resourceId}`);
        }

        const requestedQuantity = poolRequest.quantity;
        if (!this.isAvailableForQuantity(requestedQuantity)) {
            return ResultFactory.failure(`Insufficient quantity. Requested: ${requestedQuantity}, available: ${this.availableQuantity()}`);
        }

        const blockade = PoolBlockade.create(poolRequest.owner, requestedQuantity, poolRequest.duration, this._now());
        this._blockades.push(blockade);
        return ResultFactory.success(blockade.id);
    }

    unlock(request: UnlockRequest): Result<string, BlockadeId> {
        const index = this._blockades.findIndex(b => b.id.equals(request.blockadeId));
        if (index === -1) {
            return ResultFactory.failure(`Blockade not found: ${request.blockadeId}`);
        }
        const blockade = this._blockades[index];
        if (!blockade.isOwnedBy(request.requester)) {
            return ResultFactory.failure('Cannot unlock - not the owner of this blockade');
        }
        this._blockades.splice(index, 1);
        return ResultFactory.success(request.blockadeId);
    }

    isAvailable(): boolean {
        return this.availableQuantity().amount > 0;
    }

    private isAvailableForQuantity(requestedQuantity: Quantity): boolean {
        const available = this.availableQuantity();
        return available.amount >= requestedQuantity.amount;
    }

    availableQuantity(): Quantity {
        const now = this._now();
        const blockedAmount = this._blockades
            .filter(b => b.isActive(now))
            .reduce((sum, b) => sum + b.quantity.amount, 0);
        const blocked = Quantity.of(blockedAmount, this._totalCapacity.unit);
        return this._totalCapacity.subtract(this._withdrawn).subtract(blocked);
    }

    totalCapacity(): Quantity { return this._totalCapacity; }

    withdraw(quantity: Quantity): void {
        if (this._withdrawn.add(quantity).amount > this._totalCapacity.amount) {
            throw new Error('Cannot withdraw more than total capacity');
        }
        this._withdrawn = this._withdrawn.add(quantity);
    }

    replenish(quantity: Quantity): void {
        if (this._withdrawn.amount < quantity.amount) {
            throw new Error('Cannot replenish more than withdrawn');
        }
        this._withdrawn = this._withdrawn.subtract(quantity);
    }

    activeBlockades(): PoolBlockade[] {
        const now = this._now();
        return this._blockades.filter(b => b.isActive(now));
    }

    hasBlockade(blockadeId: BlockadeId): boolean {
        return this._blockades.some(b => b.id.equals(blockadeId));
    }

    version(): Version { return this._version; }

    hasExpiredBlockades(): boolean {
        const now = this._now();
        return this._blockades.some(b => b.isExpired(now));
    }

    releaseExpired(): BlockadeId[] {
        const now = this._now();
        const released = this._blockades.filter(b => b.isExpired(now)).map(b => b.id);
        const remaining = this._blockades.filter(b => !b.isExpired(now));
        this._blockades.length = 0;
        this._blockades.push(...remaining);
        return released;
    }
}
