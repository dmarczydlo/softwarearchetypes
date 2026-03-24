import { describe, it, expect } from 'vitest';
import { BatchReservationUseCase } from './BatchReservationUseCase.js';
import { BatchReservationStatus } from './BatchReservationResult.js';
import { InMemorySlotRepository, SlotRepository } from './SlotRepository.js';
import { SlotId } from './SlotId.js';
import { OwnerId } from './OwnerId.js';
import { Slot } from './Slot.js';
import { ReservationChangeRequest } from './ReservationChangeRequest.js';

describe('BatchReservationUseCase', () => {
    let slotRepository: SlotRepository;
    let batchReservationUseCase: BatchReservationUseCase;

    function setup() {
        slotRepository = new InMemorySlotRepository();
        batchReservationUseCase = new BatchReservationUseCase(slotRepository);
    }

    function thereIsSlotOwnedBy(slotId: SlotId, owner: OwnerId): Slot {
        const slot = Slot.create(slotId, owner);
        slotRepository.save(slot);
        return slot;
    }

    function thereIsFreeSlot(slotId: SlotId): Slot {
        const slot = Slot.create(slotId, OwnerId.empty());
        slotRepository.save(slot);
        return slot;
    }

    function findSlotOwner(slotId: SlotId): OwnerId {
        const slot = slotRepository.findById(slotId);
        if (!slot) throw new Error(`Slot ${slotId.value} not found`);
        return slot.getOwner();
    }

    it('executes dependent reservation changes when slots remain valid', () => {
        setup();
        const slotA = SlotId.of('SlotA');
        const slotB = SlotId.of('SlotB');
        const userX = OwnerId.of('UserX');
        const userY = OwnerId.of('UserY');

        thereIsSlotOwnedBy(slotA, userX);
        thereIsSlotOwnedBy(slotB, userY);

        const result = batchReservationUseCase.execute([
            new ReservationChangeRequest(slotA, slotB, userX),
            new ReservationChangeRequest(slotB, slotA, userY),
        ]);

        expect(result.status).toBe(BatchReservationStatus.SUCCESS);
        expect(result.executedRequests.length).toBe(2);

        expect(findSlotOwner(slotA).value).toBe(userY.value);
        expect(findSlotOwner(slotB).value).toBe(userX.value);
    });

    it('executes dependent reservation changes and skips invalid ones', () => {
        setup();
        const slotA = SlotId.of('SlotA');
        const slotB = SlotId.of('SlotB');
        const slotD = SlotId.of('SlotD');
        const userX = OwnerId.of('UserX');
        const userY = OwnerId.of('UserY');
        const userZ = OwnerId.of('UserZ');

        thereIsSlotOwnedBy(slotA, userX);
        thereIsSlotOwnedBy(slotB, userY);
        thereIsFreeSlot(slotD);

        const result = batchReservationUseCase.execute([
            new ReservationChangeRequest(slotB, slotA, userY),
            new ReservationChangeRequest(slotA, slotB, userX),
            new ReservationChangeRequest(slotD, slotA, userZ),
        ]);

        expect(result.status).toBe(BatchReservationStatus.SUCCESS);
        expect(result.executedRequests.length).toBe(2);

        expect(findSlotOwner(slotA).value).toBe(userY.value);
        expect(findSlotOwner(slotB).value).toBe(userX.value);
        expect(findSlotOwner(slotD).value).toBe(OwnerId.empty().value);
    });

    it('executes complex dependent reservation changes with multiple slots', () => {
        setup();
        const slotA = SlotId.of('SlotA');
        const slotB = SlotId.of('SlotB');
        const slotC = SlotId.of('SlotC');
        const slotD = SlotId.of('SlotD');
        const slotE = SlotId.of('SlotE');

        const userAlice = OwnerId.of('Alice');
        const userBob = OwnerId.of('Bob');
        const userCharlie = OwnerId.of('Charlie');
        const userDiana = OwnerId.of('Diana');
        const userEve = OwnerId.of('Eve');

        thereIsSlotOwnedBy(slotA, userAlice);
        thereIsSlotOwnedBy(slotB, userBob);
        thereIsSlotOwnedBy(slotC, userCharlie);
        thereIsSlotOwnedBy(slotD, userDiana);
        thereIsSlotOwnedBy(slotE, userEve);

        const result = batchReservationUseCase.execute([
            new ReservationChangeRequest(slotA, slotB, userAlice),
            new ReservationChangeRequest(slotB, slotC, userBob),
            new ReservationChangeRequest(slotC, slotD, userCharlie),
            new ReservationChangeRequest(slotD, slotE, userDiana),
            new ReservationChangeRequest(slotE, slotA, userEve),
        ]);

        expect(result.status).toBe(BatchReservationStatus.SUCCESS);
        expect(result.executedRequests.length).toBe(5);

        expect(findSlotOwner(slotA).value).toBe(userEve.value);
        expect(findSlotOwner(slotB).value).toBe(userAlice.value);
        expect(findSlotOwner(slotC).value).toBe(userBob.value);
        expect(findSlotOwner(slotD).value).toBe(userCharlie.value);
        expect(findSlotOwner(slotE).value).toBe(userDiana.value);
    });

    it('returns failure when no cycle', () => {
        setup();
        const slotA = SlotId.of('SlotA');
        const slotB = SlotId.of('SlotB');
        const userX = OwnerId.of('UserX');

        thereIsSlotOwnedBy(slotA, userX);

        const result = batchReservationUseCase.execute([
            new ReservationChangeRequest(slotA, slotB, userX),
        ]);

        expect(result.status).toBe(BatchReservationStatus.FAILURE);
        expect(result.executedRequests.length).toBe(0);

        expect(findSlotOwner(slotA).value).toBe(userX.value);
    });
});
