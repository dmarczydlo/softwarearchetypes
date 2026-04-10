import { describe, it, expect, beforeEach } from 'vitest';
import { AvailabilityConfiguration } from './availability-configuration';
import { AvailabilityFacade } from './availability-facade';
import { IndividualResourceAvailability } from './individual-resource-availability';
import { TemporalResourceAvailability } from './temporal-resource-availability';
import { IndividualLockRequest, TemporalLockRequest } from './lock-request';
import { ResourceId } from './resource-id';
import { OwnerId } from './owner-id';
import { TimeSlot } from './time-slot';
import { UnlockRequest } from './unlock-request';

describe('Medical Appointment Scenarios (Temporal)', () => {
    const DR_KOWALSKI = ResourceId.random();
    const DR_NOWAK = ResourceId.random();
    const PATIENT_ANNA = OwnerId.random();
    const PATIENT_TOMEK = OwnerId.random();

    let now: () => Date;
    let facade: AvailabilityFacade;

    beforeEach(() => {
        now = () => new Date('2024-03-15T08:00:00Z');
        facade = AvailabilityConfiguration.inMemory(now).facade();
    });

    describe('Booking appointments', () => {
        it('patient can book an available appointment slot', () => {
            const morningSlot = TimeSlot.of(new Date('2024-03-15T08:00:00Z'), new Date('2024-03-15T08:30:00Z'));
            const slot = TemporalResourceAvailability.create(DR_KOWALSKI, morningSlot, now);
            facade.register(slot);
            const booking = TemporalLockRequest.indefinite(DR_KOWALSKI, morningSlot, PATIENT_ANNA);
            const result = facade.lockTemporal(DR_KOWALSKI, booking);
            expect(result.success()).toBe(true);
            expect(facade.isAvailable(slot.id())).toBe(false);
        });

        it('second patient cannot book already taken slot', () => {
            const tenOClock = TimeSlot.of(new Date('2024-03-15T09:00:00Z'), new Date('2024-03-15T09:30:00Z'));
            const slot = TemporalResourceAvailability.create(DR_KOWALSKI, tenOClock, now);
            facade.register(slot);
            facade.lockTemporal(DR_KOWALSKI, TemporalLockRequest.indefinite(DR_KOWALSKI, tenOClock, PATIENT_ANNA));
            const result = facade.lockTemporal(DR_KOWALSKI, TemporalLockRequest.indefinite(DR_KOWALSKI, tenOClock, PATIENT_TOMEK));
            expect(result.failure()).toBe(true);
            expect(result.getFailure()).toContain('not available');
        });

        it('different doctors can have appointments at the same time', () => {
            const nineOClock = TimeSlot.of(new Date('2024-03-15T08:00:00Z'), new Date('2024-03-15T08:30:00Z'));
            const kowalskiSlot = TemporalResourceAvailability.create(DR_KOWALSKI, nineOClock, now);
            const nowakSlot = TemporalResourceAvailability.create(DR_NOWAK, nineOClock, now);
            facade.register(kowalskiSlot);
            facade.register(nowakSlot);
            const annaResult = facade.lockTemporal(DR_KOWALSKI, TemporalLockRequest.indefinite(DR_KOWALSKI, nineOClock, PATIENT_ANNA));
            const tomekResult = facade.lockTemporal(DR_NOWAK, TemporalLockRequest.indefinite(DR_NOWAK, nineOClock, PATIENT_TOMEK));
            expect(annaResult.success()).toBe(true);
            expect(tomekResult.success()).toBe(true);
        });
    });

    describe('Cancelling appointments', () => {
        it('patient can cancel their own appointment', () => {
            const slot = TimeSlot.of(new Date('2024-03-15T10:00:00Z'), new Date('2024-03-15T10:30:00Z'));
            const availability = TemporalResourceAvailability.create(DR_KOWALSKI, slot, now);
            facade.register(availability);
            const bookingId = facade.lockTemporal(DR_KOWALSKI, TemporalLockRequest.indefinite(DR_KOWALSKI, slot, PATIENT_ANNA)).getSuccess();
            const result = facade.unlock(availability.id(), UnlockRequest.of(PATIENT_ANNA, bookingId));
            expect(result.success()).toBe(true);
            expect(facade.isAvailable(availability.id())).toBe(true);
        });

        it('patient cannot cancel another patients appointment', () => {
            const slot = TimeSlot.of(new Date('2024-03-15T13:00:00Z'), new Date('2024-03-15T13:30:00Z'));
            const availability = TemporalResourceAvailability.create(DR_KOWALSKI, slot, now);
            facade.register(availability);
            const bookingId = facade.lockTemporal(DR_KOWALSKI, TemporalLockRequest.indefinite(DR_KOWALSKI, slot, PATIENT_ANNA)).getSuccess();
            const result = facade.unlock(availability.id(), UnlockRequest.of(PATIENT_TOMEK, bookingId));
            expect(result.failure()).toBe(true);
            expect(result.getFailure()).toContain('not the owner');
        });
    });
});

describe('Medical Equipment Scenarios (Individual)', () => {
    const MRI_SCANNER = ResourceId.random();
    const PORTABLE_XRAY = ResourceId.random();
    const ULTRASOUND_MACHINE = ResourceId.random();
    const RADIOLOGY_DEPT = OwnerId.random();
    const CARDIOLOGY_DEPT = OwnerId.random();
    const EMERGENCY_DEPT = OwnerId.random();

    let now: () => Date;
    let facade: AvailabilityFacade;

    beforeEach(() => {
        now = () => new Date('2024-03-15T08:00:00Z');
        facade = AvailabilityConfiguration.inMemory(now).facade();
    });

    describe('Reserving equipment', () => {
        it('department can reserve available MRI scanner', () => {
            const mri = IndividualResourceAvailability.create(MRI_SCANNER, now);
            facade.register(mri);
            const request = IndividualLockRequest.indefinite(MRI_SCANNER, RADIOLOGY_DEPT);
            const result = facade.lockIndividual(MRI_SCANNER, request);
            expect(result.success()).toBe(true);
            expect(facade.isAvailable(mri.id())).toBe(false);
        });

        it('second department cannot reserve already taken equipment', () => {
            const mri = IndividualResourceAvailability.create(MRI_SCANNER, now);
            facade.register(mri);
            facade.lockIndividual(MRI_SCANNER, IndividualLockRequest.indefinite(MRI_SCANNER, RADIOLOGY_DEPT));
            const result = facade.lockIndividual(MRI_SCANNER, IndividualLockRequest.indefinite(MRI_SCANNER, CARDIOLOGY_DEPT));
            expect(result.failure()).toBe(true);
            expect(result.getFailure()).toContain('not available');
        });

        it('different departments can reserve different equipment', () => {
            const mri = IndividualResourceAvailability.create(MRI_SCANNER, now);
            const xray = IndividualResourceAvailability.create(PORTABLE_XRAY, now);
            const ultrasound = IndividualResourceAvailability.create(ULTRASOUND_MACHINE, now);
            facade.register(mri);
            facade.register(xray);
            facade.register(ultrasound);
            const radiologyResult = facade.lockIndividual(MRI_SCANNER, IndividualLockRequest.indefinite(MRI_SCANNER, RADIOLOGY_DEPT));
            const cardiologyResult = facade.lockIndividual(ULTRASOUND_MACHINE, IndividualLockRequest.indefinite(ULTRASOUND_MACHINE, CARDIOLOGY_DEPT));
            const emergencyResult = facade.lockIndividual(PORTABLE_XRAY, IndividualLockRequest.indefinite(PORTABLE_XRAY, EMERGENCY_DEPT));
            expect(radiologyResult.success()).toBe(true);
            expect(cardiologyResult.success()).toBe(true);
            expect(emergencyResult.success()).toBe(true);
        });
    });

    describe('Releasing equipment', () => {
        it('department can release their reserved equipment', () => {
            const mri = IndividualResourceAvailability.create(MRI_SCANNER, now);
            facade.register(mri);
            const reservation = facade.lockIndividual(MRI_SCANNER, IndividualLockRequest.indefinite(MRI_SCANNER, RADIOLOGY_DEPT)).getSuccess();
            const result = facade.unlock(mri.id(), UnlockRequest.of(RADIOLOGY_DEPT, reservation));
            expect(result.success()).toBe(true);
            expect(facade.isAvailable(mri.id())).toBe(true);
        });

        it('released equipment can be reserved by another department', () => {
            const mri = IndividualResourceAvailability.create(MRI_SCANNER, now);
            facade.register(mri);
            const reservation = facade.lockIndividual(MRI_SCANNER, IndividualLockRequest.indefinite(MRI_SCANNER, RADIOLOGY_DEPT)).getSuccess();
            facade.unlock(mri.id(), UnlockRequest.of(RADIOLOGY_DEPT, reservation));
            const result = facade.lockIndividual(MRI_SCANNER, IndividualLockRequest.indefinite(MRI_SCANNER, CARDIOLOGY_DEPT));
            expect(result.success()).toBe(true);
        });
    });
});
