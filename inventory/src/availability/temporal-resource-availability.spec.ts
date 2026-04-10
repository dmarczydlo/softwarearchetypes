import { describe, it, expect } from 'vitest';
import { TemporalResourceAvailability } from './temporal-resource-availability';
import { TemporalLockRequest } from './lock-request';
import { LockDurationFactory } from './lock-duration';
import { ResourceId } from './resource-id';
import { OwnerId } from './owner-id';
import { TimeSlot } from './time-slot';
import { UnlockRequest } from './unlock-request';

describe('TemporalResourceAvailability', () => {
    const ROOM_101 = ResourceId.random();
    const ALICE = OwnerId.random();
    const BOB = OwnerId.random();

    it('new slot is available', () => {
        const jan15 = TimeSlot.ofLocalDate(2024, 1, 15);
        const room = TemporalResourceAvailability.create(ROOM_101, jan15);
        expect(room.isAvailable()).toBe(true);
    });

    it('can lock available slot', () => {
        const jan15 = TimeSlot.ofLocalDate(2024, 1, 15);
        const room = TemporalResourceAvailability.create(ROOM_101, jan15);
        const request = TemporalLockRequest.indefinite(ROOM_101, jan15, ALICE);
        const result = room.lock(request);
        expect(result.success()).toBe(true);
        expect(room.isAvailable()).toBe(false);
    });

    it('cannot lock already locked slot', () => {
        const jan15 = TimeSlot.ofLocalDate(2024, 1, 15);
        const room = TemporalResourceAvailability.create(ROOM_101, jan15);
        room.lock(TemporalLockRequest.indefinite(ROOM_101, jan15, ALICE));
        const result = room.lock(TemporalLockRequest.indefinite(ROOM_101, jan15, BOB));
        expect(result.failure()).toBe(true);
    });

    it('same owner can relock slot', () => {
        const jan15 = TimeSlot.ofLocalDate(2024, 1, 15);
        const room = TemporalResourceAvailability.create(ROOM_101, jan15);
        room.lock(TemporalLockRequest.indefinite(ROOM_101, jan15, ALICE));
        const result = room.lock(TemporalLockRequest.indefinite(ROOM_101, jan15, ALICE));
        expect(result.success()).toBe(true);
    });

    it('owner can unlock slot', () => {
        const jan15 = TimeSlot.ofLocalDate(2024, 1, 15);
        const room = TemporalResourceAvailability.create(ROOM_101, jan15);
        const lockResult = room.lock(TemporalLockRequest.indefinite(ROOM_101, jan15, ALICE));
        const blockadeId = lockResult.getSuccess();
        const unlockResult = room.unlock(UnlockRequest.of(ALICE, blockadeId));
        expect(unlockResult.success()).toBe(true);
        expect(room.isAvailable()).toBe(true);
    });

    it('non-owner cannot unlock slot', () => {
        const jan15 = TimeSlot.ofLocalDate(2024, 1, 15);
        const room = TemporalResourceAvailability.create(ROOM_101, jan15);
        const lockResult = room.lock(TemporalLockRequest.indefinite(ROOM_101, jan15, ALICE));
        const blockadeId = lockResult.getSuccess();
        const unlockResult = room.unlock(UnlockRequest.of(BOB, blockadeId));
        expect(unlockResult.failure()).toBe(true);
        expect(room.isAvailable()).toBe(false);
    });
});
