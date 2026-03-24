import { BlockadeId } from './blockade-id';
import { OwnerId } from './owner-id';
import { LockDuration } from './lock-duration';

export interface Blockade {
    readonly id: BlockadeId;
    readonly owner: OwnerId;
    readonly blockedAt: Date;
    readonly duration: LockDuration;

    isActive(now: Date): boolean;
    isExpired(now: Date): boolean;
    isOwnedBy(requester: OwnerId): boolean;
}

function blockadeIsActive(blockade: Blockade, now: Date): boolean {
    return blockade.duration.isActive(now, blockade.blockedAt);
}

function blockadeIsExpired(blockade: Blockade, now: Date): boolean {
    return blockade.duration.isExpired(now, blockade.blockedAt);
}

function blockadeIsOwnedBy(blockade: Blockade, requester: OwnerId): boolean {
    return blockade.owner.equals(requester);
}

export class IndividualBlockade implements Blockade {
    readonly id: BlockadeId;
    readonly owner: OwnerId;
    readonly blockedAt: Date;
    readonly duration: LockDuration;

    constructor(id: BlockadeId, owner: OwnerId, blockedAt: Date, duration: LockDuration) {
        if (!id) throw new Error('BlockadeId cannot be null');
        if (!owner) throw new Error('OwnerId cannot be null');
        if (!blockedAt) throw new Error('blockedAt cannot be null');
        if (!duration) throw new Error('LockDuration cannot be null');
        this.id = id;
        this.owner = owner;
        this.blockedAt = blockedAt;
        this.duration = duration;
    }

    static create(owner: OwnerId, duration: LockDuration, now: Date = new Date()): IndividualBlockade {
        return new IndividualBlockade(BlockadeId.random(), owner, now, duration);
    }

    isActive(now: Date): boolean { return blockadeIsActive(this, now); }
    isExpired(now: Date): boolean { return blockadeIsExpired(this, now); }
    isOwnedBy(requester: OwnerId): boolean { return blockadeIsOwnedBy(this, requester); }
}

export class TemporalBlockade implements Blockade {
    readonly id: BlockadeId;
    readonly owner: OwnerId;
    readonly blockedAt: Date;
    readonly duration: LockDuration;

    constructor(id: BlockadeId, owner: OwnerId, blockedAt: Date, duration: LockDuration) {
        if (!id) throw new Error('BlockadeId cannot be null');
        if (!owner) throw new Error('OwnerId cannot be null');
        if (!blockedAt) throw new Error('blockedAt cannot be null');
        if (!duration) throw new Error('LockDuration cannot be null');
        this.id = id;
        this.owner = owner;
        this.blockedAt = blockedAt;
        this.duration = duration;
    }

    static create(owner: OwnerId, duration: LockDuration, now: Date = new Date()): TemporalBlockade {
        return new TemporalBlockade(BlockadeId.random(), owner, now, duration);
    }

    isActive(now: Date): boolean { return blockadeIsActive(this, now); }
    isExpired(now: Date): boolean { return blockadeIsExpired(this, now); }
    isOwnedBy(requester: OwnerId): boolean { return blockadeIsOwnedBy(this, requester); }
}

export class PoolBlockade implements Blockade {
    readonly id: BlockadeId;
    readonly owner: OwnerId;
    readonly blockedAt: Date;
    readonly duration: LockDuration;
    readonly quantity: import('@softwarearchetypes/quantity').Quantity;

    constructor(
        id: BlockadeId,
        owner: OwnerId,
        quantity: import('@softwarearchetypes/quantity').Quantity,
        blockedAt: Date,
        duration: LockDuration,
    ) {
        if (!id) throw new Error('BlockadeId cannot be null');
        if (!owner) throw new Error('OwnerId cannot be null');
        if (!quantity) throw new Error('Quantity cannot be null');
        if (!blockedAt) throw new Error('blockedAt cannot be null');
        if (!duration) throw new Error('LockDuration cannot be null');
        this.id = id;
        this.owner = owner;
        this.quantity = quantity;
        this.blockedAt = blockedAt;
        this.duration = duration;
    }

    static create(
        owner: OwnerId,
        quantity: import('@softwarearchetypes/quantity').Quantity,
        duration: LockDuration,
        now: Date = new Date(),
    ): PoolBlockade {
        return new PoolBlockade(BlockadeId.random(), owner, quantity, now, duration);
    }

    isActive(now: Date): boolean { return blockadeIsActive(this, now); }
    isExpired(now: Date): boolean { return blockadeIsExpired(this, now); }
    isOwnedBy(requester: OwnerId): boolean { return blockadeIsOwnedBy(this, requester); }
}
