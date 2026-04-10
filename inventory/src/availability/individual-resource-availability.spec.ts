import { describe, it, expect } from 'vitest';
import { IndividualResourceAvailability } from './individual-resource-availability';
import { IndividualLockRequest } from './lock-request';
import { LockDurationFactory } from './lock-duration';
import { ResourceId } from './resource-id';
import { OwnerId } from './owner-id';
import { UnlockRequest } from './unlock-request';

describe('IndividualResourceAvailability', () => {
    const LAPTOP_ID = ResourceId.random();
    const ALICE = OwnerId.random();
    const BOB = OwnerId.random();

    it('new resource is available', () => {
        const laptop = IndividualResourceAvailability.create(LAPTOP_ID);
        expect(laptop.isAvailable()).toBe(true);
    });

    it('can lock available resource', () => {
        const laptop = IndividualResourceAvailability.create(LAPTOP_ID);
        const request = IndividualLockRequest.of(LAPTOP_ID, ALICE, LockDurationFactory.indefinite());
        const result = laptop.lock(request);
        expect(result.success()).toBe(true);
        expect(laptop.isAvailable()).toBe(false);
    });

    it('cannot lock already locked resource', () => {
        const laptop = IndividualResourceAvailability.create(LAPTOP_ID);
        laptop.lock(IndividualLockRequest.of(LAPTOP_ID, ALICE, LockDurationFactory.indefinite()));
        const result = laptop.lock(IndividualLockRequest.of(LAPTOP_ID, BOB, LockDurationFactory.indefinite()));
        expect(result.failure()).toBe(true);
    });

    it('same owner can relock resource', () => {
        const laptop = IndividualResourceAvailability.create(LAPTOP_ID);
        laptop.lock(IndividualLockRequest.of(LAPTOP_ID, ALICE, LockDurationFactory.indefinite()));
        const result = laptop.lock(IndividualLockRequest.of(LAPTOP_ID, ALICE, LockDurationFactory.indefinite()));
        expect(result.success()).toBe(true);
    });

    it('owner can unlock resource', () => {
        const laptop = IndividualResourceAvailability.create(LAPTOP_ID);
        const lockResult = laptop.lock(IndividualLockRequest.of(LAPTOP_ID, ALICE, LockDurationFactory.indefinite()));
        const blockadeId = lockResult.getSuccess();
        const unlockResult = laptop.unlock(UnlockRequest.of(ALICE, blockadeId));
        expect(unlockResult.success()).toBe(true);
        expect(laptop.isAvailable()).toBe(true);
    });

    it('non-owner cannot unlock resource', () => {
        const laptop = IndividualResourceAvailability.create(LAPTOP_ID);
        const lockResult = laptop.lock(IndividualLockRequest.of(LAPTOP_ID, ALICE, LockDurationFactory.indefinite()));
        const blockadeId = lockResult.getSuccess();
        const unlockResult = laptop.unlock(UnlockRequest.of(BOB, blockadeId));
        expect(unlockResult.failure()).toBe(true);
        expect(laptop.isAvailable()).toBe(false);
    });

    it('timed lock expires after duration', () => {
        const now = new Date('2024-01-15T10:00:00Z');
        const fixedNow = () => now;
        const laptop = IndividualResourceAvailability.create(LAPTOP_ID, fixedNow);
        laptop.lock(IndividualLockRequest.of(LAPTOP_ID, ALICE, LockDurationFactory.ofHours(1)));

        const afterExpiry = () => new Date('2024-01-15T12:00:00Z');
        const laptopAfter = new IndividualResourceAvailability(
            laptop.id(), LAPTOP_ID, afterExpiry, laptop.currentBlockade(), laptop.version(),
        );
        expect(laptopAfter.isAvailable()).toBe(true);
    });

    it('timed lock is active within duration', () => {
        const now = new Date('2024-01-15T10:00:00Z');
        const fixedNow = () => now;
        const laptop = IndividualResourceAvailability.create(LAPTOP_ID, fixedNow);
        laptop.lock(IndividualLockRequest.of(LAPTOP_ID, ALICE, LockDurationFactory.ofHours(2)));

        const withinDuration = () => new Date('2024-01-15T11:00:00Z');
        const laptopDuring = new IndividualResourceAvailability(
            laptop.id(), LAPTOP_ID, withinDuration, laptop.currentBlockade(), laptop.version(),
        );
        expect(laptopDuring.isAvailable()).toBe(false);
    });
});
