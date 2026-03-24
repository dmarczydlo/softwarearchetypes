import { Quantity } from '@softwarearchetypes/quantity';
import { LockDuration } from './lock-duration';
import { OwnerId } from './owner-id';
import { ResourceId } from './resource-id';
import { TimeSlot } from './time-slot';

export type LockRequestType = 'INDIVIDUAL' | 'POOL' | 'TEMPORAL' | 'COMPOSITE';

export interface LockRequest {
    readonly type: LockRequestType;
    readonly resourceId: ResourceId | null;
    readonly owner: OwnerId;
    readonly duration: LockDuration;
}

export class IndividualLockRequest implements LockRequest {
    readonly type: LockRequestType = 'INDIVIDUAL';
    readonly resourceId: ResourceId;
    readonly owner: OwnerId;
    readonly duration: LockDuration;

    constructor(resourceId: ResourceId, owner: OwnerId, duration: LockDuration) {
        if (!resourceId) throw new Error('ResourceId cannot be null');
        if (!owner) throw new Error('OwnerId cannot be null');
        if (!duration) throw new Error('LockDuration cannot be null');
        this.resourceId = resourceId;
        this.owner = owner;
        this.duration = duration;
    }

    static of(resourceId: ResourceId, owner: OwnerId, duration: LockDuration): IndividualLockRequest {
        return new IndividualLockRequest(resourceId, owner, duration);
    }

    static indefinite(resourceId: ResourceId, owner: OwnerId): IndividualLockRequest {
        return new IndividualLockRequest(resourceId, owner, { isActive: () => true, isExpired: () => false });
    }
}

export class PoolLockRequest implements LockRequest {
    readonly type: LockRequestType = 'POOL';
    readonly resourceId: ResourceId;
    readonly quantity: Quantity;
    readonly owner: OwnerId;
    readonly duration: LockDuration;

    constructor(resourceId: ResourceId, quantity: Quantity, owner: OwnerId, duration: LockDuration) {
        if (!resourceId) throw new Error('ResourceId cannot be null');
        if (!quantity) throw new Error('Quantity cannot be null');
        if (!owner) throw new Error('OwnerId cannot be null');
        if (!duration) throw new Error('LockDuration cannot be null');
        this.resourceId = resourceId;
        this.quantity = quantity;
        this.owner = owner;
        this.duration = duration;
    }

    static of(resourceId: ResourceId, quantity: Quantity, owner: OwnerId, duration: LockDuration): PoolLockRequest {
        return new PoolLockRequest(resourceId, quantity, owner, duration);
    }

    static indefinite(resourceId: ResourceId, quantity: Quantity, owner: OwnerId): PoolLockRequest {
        return new PoolLockRequest(resourceId, quantity, owner, { isActive: () => true, isExpired: () => false });
    }
}

export class TemporalLockRequest implements LockRequest {
    readonly type: LockRequestType = 'TEMPORAL';
    readonly resourceId: ResourceId;
    readonly slot: TimeSlot;
    readonly owner: OwnerId;
    readonly duration: LockDuration;

    constructor(resourceId: ResourceId, slot: TimeSlot, owner: OwnerId, duration: LockDuration) {
        if (!resourceId) throw new Error('ResourceId cannot be null');
        if (!slot) throw new Error('TimeSlot cannot be null');
        if (!owner) throw new Error('OwnerId cannot be null');
        if (!duration) throw new Error('LockDuration cannot be null');
        this.resourceId = resourceId;
        this.slot = slot;
        this.owner = owner;
        this.duration = duration;
    }

    static of(resourceId: ResourceId, slot: TimeSlot, owner: OwnerId, duration: LockDuration): TemporalLockRequest {
        return new TemporalLockRequest(resourceId, slot, owner, duration);
    }

    static indefinite(resourceId: ResourceId, slot: TimeSlot, owner: OwnerId): TemporalLockRequest {
        return new TemporalLockRequest(resourceId, slot, owner, { isActive: () => true, isExpired: () => false });
    }
}

export class CompositeLockRequest implements LockRequest {
    readonly type: LockRequestType = 'COMPOSITE';
    readonly resourceId: ResourceId | null;
    readonly componentRequests: Map<string, LockRequest>;
    readonly owner: OwnerId;
    readonly duration: LockDuration;

    constructor(
        resourceId: ResourceId | null,
        componentRequests: Map<string, LockRequest>,
        owner: OwnerId,
        duration: LockDuration,
    ) {
        if (!componentRequests) throw new Error('componentRequests cannot be null');
        if (!owner) throw new Error('OwnerId cannot be null');
        if (!duration) throw new Error('LockDuration cannot be null');
        if (componentRequests.size === 0) {
            throw new Error('componentRequests cannot be empty');
        }
        this.resourceId = resourceId;
        this.componentRequests = componentRequests;
        this.owner = owner;
        this.duration = duration;
    }

    static of(componentRequests: Map<string, LockRequest>, owner: OwnerId, duration: LockDuration): CompositeLockRequest {
        return new CompositeLockRequest(null, componentRequests, owner, duration);
    }

    getRequestForComponent(componentId: string): LockRequest | null {
        return this.componentRequests.get(componentId) ?? null;
    }
}
