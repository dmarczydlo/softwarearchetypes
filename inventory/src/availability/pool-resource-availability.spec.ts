import { describe, it, expect } from 'vitest';
import { Quantity, Unit } from '@softwarearchetypes/quantity';
import { PoolResourceAvailability } from './pool-resource-availability';
import { PoolLockRequest } from './lock-request';
import { LockDurationFactory } from './lock-duration';
import { ResourceId } from './resource-id';
import { OwnerId } from './owner-id';
import { UnlockRequest } from './unlock-request';

describe('PoolResourceAvailability', () => {
    const MILK_ID = ResourceId.random();
    const ALICE = OwnerId.random();
    const BOB = OwnerId.random();
    const LITERS = Unit.liters();

    it('new pool has full capacity', () => {
        const capacity = Quantity.of(100, LITERS);
        const milk = PoolResourceAvailability.create(MILK_ID, capacity);
        expect(milk.isAvailable()).toBe(true);
        expect(milk.availableQuantity().equals(capacity)).toBe(true);
    });

    it('can lock part of pool', () => {
        const capacity = Quantity.of(100, LITERS);
        const milk = PoolResourceAvailability.create(MILK_ID, capacity);
        const requested = Quantity.of(30, LITERS);
        const result = milk.lock(PoolLockRequest.of(MILK_ID, requested, ALICE, LockDurationFactory.indefinite()));
        expect(result.isSuccess()).toBe(true);
        expect(milk.availableQuantity().amount).toBe(70);
    });

    it('multiple owners can lock different portions', () => {
        const capacity = Quantity.of(100, LITERS);
        const milk = PoolResourceAvailability.create(MILK_ID, capacity);
        milk.lock(PoolLockRequest.of(MILK_ID, Quantity.of(30, LITERS), ALICE, LockDurationFactory.indefinite()));
        milk.lock(PoolLockRequest.of(MILK_ID, Quantity.of(40, LITERS), BOB, LockDurationFactory.indefinite()));
        expect(milk.availableQuantity().amount).toBe(30);
        expect(milk.activeBlockades()).toHaveLength(2);
    });

    it('cannot lock more than available', () => {
        const capacity = Quantity.of(100, LITERS);
        const milk = PoolResourceAvailability.create(MILK_ID, capacity);
        milk.lock(PoolLockRequest.of(MILK_ID, Quantity.of(80, LITERS), ALICE, LockDurationFactory.indefinite()));
        const result = milk.lock(PoolLockRequest.of(MILK_ID, Quantity.of(30, LITERS), BOB, LockDurationFactory.indefinite()));
        expect(result.isFailure()).toBe(true);
    });

    it('unlocking restores capacity', () => {
        const capacity = Quantity.of(100, LITERS);
        const milk = PoolResourceAvailability.create(MILK_ID, capacity);
        const lockResult = milk.lock(PoolLockRequest.of(MILK_ID, Quantity.of(30, LITERS), ALICE, LockDurationFactory.indefinite()));
        const blockadeId = lockResult.getSuccess();
        milk.unlock(UnlockRequest.of(ALICE, blockadeId));
        expect(milk.availableQuantity().equals(capacity)).toBe(true);
    });

    it('withdraw reduces capacity permanently', () => {
        const capacity = Quantity.of(100, LITERS);
        const milk = PoolResourceAvailability.create(MILK_ID, capacity);
        milk.withdraw(Quantity.of(20, LITERS));
        expect(milk.availableQuantity().amount).toBe(80);
    });

    it('replenish restores withdrawn capacity', () => {
        const capacity = Quantity.of(100, LITERS);
        const milk = PoolResourceAvailability.create(MILK_ID, capacity);
        milk.withdraw(Quantity.of(20, LITERS));
        milk.replenish(Quantity.of(10, LITERS));
        expect(milk.availableQuantity().amount).toBe(90);
    });

    it('withdrawn and blocked both reduce availability', () => {
        const capacity = Quantity.of(100, LITERS);
        const milk = PoolResourceAvailability.create(MILK_ID, capacity);
        milk.withdraw(Quantity.of(20, LITERS));
        milk.lock(PoolLockRequest.of(MILK_ID, Quantity.of(30, LITERS), ALICE, LockDurationFactory.indefinite()));
        expect(milk.availableQuantity().amount).toBe(50);
    });
});
