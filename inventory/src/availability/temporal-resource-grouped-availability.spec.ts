import { describe, it, expect } from 'vitest';
import { TemporalResourceGroupedAvailability } from './temporal-resource-grouped-availability';
import { TemporalLockRequest } from './lock-request';
import { LockDurationFactory } from './lock-duration';
import { ResourceId } from './resource-id';
import { OwnerId } from './owner-id';
import { TimeSlot } from './time-slot';

describe('TemporalResourceGroupedAvailability', () => {
    const ROOM_101 = ResourceId.random();
    const ALICE = OwnerId.random();
    const BOB = OwnerId.random();

    it('can block multiple slots at once', () => {
        const slots = [
            TimeSlot.ofLocalDate(2024, 1, 15),
            TimeSlot.ofLocalDate(2024, 1, 16),
            TimeSlot.ofLocalDate(2024, 1, 17),
        ];
        const stay = TemporalResourceGroupedAvailability.of(ROOM_101, slots);

        const result = stay.block(ALICE, LockDurationFactory.indefinite());
        expect(result.isSuccess()).toBe(true);
        expect(result.getSuccess()).toHaveLength(3);
        expect(stay.blockedEntirelyBy(ALICE)).toBe(true);
    });

    it('fails if any slots are unavailable', () => {
        const slots = [
            TimeSlot.ofLocalDate(2024, 1, 15),
            TimeSlot.ofLocalDate(2024, 1, 16),
            TimeSlot.ofLocalDate(2024, 1, 17),
        ];
        const stay = TemporalResourceGroupedAvailability.of(ROOM_101, slots);

        // someone books the middle night
        stay.availabilities()[1].lock(TemporalLockRequest.indefinite(ROOM_101, slots[1], BOB));

        const result = stay.block(ALICE, LockDurationFactory.indefinite());
        expect(result.isFailure()).toBe(true);
        // first night should not be blocked (rollback)
        expect(stay.availabilities()[0].isAvailable()).toBe(true);
    });

    it('can release multiple slots', () => {
        const slots = [
            TimeSlot.ofLocalDate(2024, 1, 15),
            TimeSlot.ofLocalDate(2024, 1, 16),
        ];
        const stay = TemporalResourceGroupedAvailability.of(ROOM_101, slots);
        const blockResult = stay.block(ALICE, LockDurationFactory.indefinite());
        const blockadeIds = blockResult.getSuccess();

        const releaseResult = stay.release(ALICE, blockadeIds);
        expect(releaseResult.isSuccess()).toBe(true);
        expect(stay.isEntirelyAvailable()).toBe(true);
    });

    it('tracks multiple owners', () => {
        const slots = [
            TimeSlot.ofLocalDate(2024, 1, 15),
            TimeSlot.ofLocalDate(2024, 1, 16),
        ];
        const stay = TemporalResourceGroupedAvailability.of(ROOM_101, slots);

        stay.availabilities()[0].lock(TemporalLockRequest.indefinite(ROOM_101, slots[0], ALICE));
        stay.availabilities()[1].lock(TemporalLockRequest.indefinite(ROOM_101, slots[1], BOB));

        expect(stay.owners().size).toBe(2);
        expect(stay.isEntirelyAvailable()).toBe(false);
        expect(stay.blockedEntirelyBy(ALICE)).toBe(false);
    });
});
