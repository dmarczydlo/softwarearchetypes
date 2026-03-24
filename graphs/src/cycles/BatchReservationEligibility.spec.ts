import { describe, it, expect } from 'vitest';
import { BatchReservationUseCase } from './BatchReservationUseCase.js';
import { BatchReservationStatus } from './BatchReservationResult.js';
import { InMemorySlotRepository, SlotRepository } from './SlotRepository.js';
import { SlotId } from './SlotId.js';
import { OwnerId } from './OwnerId.js';
import { Slot } from './Slot.js';
import { ReservationChangeRequest } from './ReservationChangeRequest.js';
import { Eligibility } from './Eligibility.js';

describe('BatchReservationEligibilityUseCase', () => {
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

    function findSlotOwner(slotId: SlotId): OwnerId {
        const slot = slotRepository.findById(slotId);
        if (!slot) throw new Error(`Slot ${slotId.value} not found`);
        return slot.getOwner();
    }

    it('executes reservation changes when all users eligible', () => {
        setup();
        const slotA = SlotId.of('SlotA');
        const slotB = SlotId.of('SlotB');
        const userX = OwnerId.of('UserX');
        const userY = OwnerId.of('UserY');

        thereIsSlotOwnedBy(slotA, userX);
        thereIsSlotOwnedBy(slotB, userY);

        const eligibility = new Eligibility();
        eligibility.markTransferEligible(userX, userY);
        eligibility.markTransferEligible(userY, userX);

        const result = batchReservationUseCase.execute([
            new ReservationChangeRequest(slotA, slotB, userX),
            new ReservationChangeRequest(slotB, slotA, userY),
        ], eligibility);

        expect(result.status).toBe(BatchReservationStatus.SUCCESS);
        expect(result.executedRequests.length).toBe(2);

        expect(findSlotOwner(slotA).value).toBe(userY.value);
        expect(findSlotOwner(slotB).value).toBe(userX.value);
    });

    it('does not execute when one user not eligible', () => {
        setup();
        const slotA = SlotId.of('SlotA');
        const slotB = SlotId.of('SlotB');
        const userX = OwnerId.of('UserX');
        const userY = OwnerId.of('UserY');

        thereIsSlotOwnedBy(slotA, userX);
        thereIsSlotOwnedBy(slotB, userY);

        const eligibility = new Eligibility();
        eligibility.markTransferEligible(userX, userY);

        const result = batchReservationUseCase.execute([
            new ReservationChangeRequest(slotA, slotB, userX),
            new ReservationChangeRequest(slotB, slotA, userY),
        ], eligibility);

        expect(result.status).toBe(BatchReservationStatus.FAILURE);
        expect(result.executedRequests.length).toBe(0);

        expect(findSlotOwner(slotA).value).toBe(userX.value);
        expect(findSlotOwner(slotB).value).toBe(userY.value);
    });

    it('executes long cycle when all eligible', () => {
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

        const eligibility = new Eligibility();
        eligibility.markTransferEligible(userAlice, userBob);
        eligibility.markTransferEligible(userBob, userCharlie);
        eligibility.markTransferEligible(userCharlie, userDiana);
        eligibility.markTransferEligible(userDiana, userEve);
        eligibility.markTransferEligible(userEve, userAlice);

        const result = batchReservationUseCase.execute([
            new ReservationChangeRequest(slotA, slotB, userAlice),
            new ReservationChangeRequest(slotB, slotC, userBob),
            new ReservationChangeRequest(slotC, slotD, userCharlie),
            new ReservationChangeRequest(slotD, slotE, userDiana),
            new ReservationChangeRequest(slotE, slotA, userEve),
        ], eligibility);

        expect(result.status).toBe(BatchReservationStatus.SUCCESS);
        expect(result.executedRequests.length).toBe(5);

        expect(findSlotOwner(slotA).value).toBe(userEve.value);
        expect(findSlotOwner(slotB).value).toBe(userAlice.value);
        expect(findSlotOwner(slotC).value).toBe(userBob.value);
        expect(findSlotOwner(slotD).value).toBe(userCharlie.value);
        expect(findSlotOwner(slotE).value).toBe(userDiana.value);
    });

    it('does not execute cycle when one edge ineligible', () => {
        setup();
        const slotA = SlotId.of('SlotA');
        const slotB = SlotId.of('SlotB');
        const slotC = SlotId.of('SlotC');

        const userAlice = OwnerId.of('Alice');
        const userBob = OwnerId.of('Bob');
        const userCharlie = OwnerId.of('Charlie');

        thereIsSlotOwnedBy(slotA, userAlice);
        thereIsSlotOwnedBy(slotB, userBob);
        thereIsSlotOwnedBy(slotC, userCharlie);

        const eligibility = new Eligibility();
        eligibility.markTransferEligible(userAlice, userBob);
        eligibility.markTransferEligible(userBob, userCharlie);

        const result = batchReservationUseCase.execute([
            new ReservationChangeRequest(slotA, slotB, userAlice),
            new ReservationChangeRequest(slotB, slotC, userBob),
            new ReservationChangeRequest(slotC, slotA, userCharlie),
        ], eligibility);

        expect(result.status).toBe(BatchReservationStatus.FAILURE);
        expect(result.executedRequests.length).toBe(0);

        expect(findSlotOwner(slotA).value).toBe(userAlice.value);
        expect(findSlotOwner(slotB).value).toBe(userBob.value);
        expect(findSlotOwner(slotC).value).toBe(userCharlie.value);
    });

    it('can revoke eligibility', () => {
        setup();
        const slotA = SlotId.of('SlotA');
        const slotB = SlotId.of('SlotB');
        const userX = OwnerId.of('UserX');
        const userY = OwnerId.of('UserY');

        thereIsSlotOwnedBy(slotA, userX);
        thereIsSlotOwnedBy(slotB, userY);

        const eligibility = new Eligibility();
        eligibility.markTransferEligible(userX, userY);
        eligibility.markTransferEligible(userY, userX);

        eligibility.markTransferIneligible(userY, userX);

        const result = batchReservationUseCase.execute([
            new ReservationChangeRequest(slotA, slotB, userX),
            new ReservationChangeRequest(slotB, slotA, userY),
        ], eligibility);

        expect(result.status).toBe(BatchReservationStatus.FAILURE);
        expect(result.executedRequests.length).toBe(0);

        expect(findSlotOwner(slotA).value).toBe(userX.value);
        expect(findSlotOwner(slotB).value).toBe(userY.value);
    });
});
