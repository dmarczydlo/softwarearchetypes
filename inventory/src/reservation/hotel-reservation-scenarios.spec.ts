import { describe, it, expect, beforeEach } from 'vitest';
import { Quantity, Unit } from '@softwarearchetypes/quantity';
import { AvailabilityConfiguration } from '../availability/availability-configuration';
import { AvailabilityFixture } from '../availability/availability-fixture';
import { OwnerId } from '../availability/owner-id';
import { ResourceId } from '../availability/resource-id';
import { TimeSlot } from '../availability/time-slot';
import { CreateInventoryEntry } from '../create-inventory-entry';
import { InstanceId } from '../instance-id';
import { InventoryConfiguration } from '../inventory-configuration';
import { InventoryFacade } from '../inventory-facade';
import { InventoryProduct } from '../inventory-product';
import { ProductIdentifier } from '../product-identifier';
import { TemporalSpecification } from '../resource-specification';
import { ReservationConfiguration } from './reservation-configuration';
import { ReservationFacade } from './reservation-facade';
import { ReservationPurpose } from './reservation-purpose';
import { ReserveRequest } from './reserve-request';

describe('Hotel Reservation Scenarios (Temporal)', () => {
    const CHECK_IN = new Date(Date.UTC(2024, 5, 15)); // June 15
    const GUEST_ANNA = OwnerId.random();
    const GUEST_TOMEK = OwnerId.random();

    let now: () => Date;
    let inventoryFacade: InventoryFacade;
    let reservationFacade: ReservationFacade;
    let availabilityFixture: AvailabilityFixture;

    beforeEach(() => {
        now = () => new Date('2024-06-01T10:00:00Z');
        const availabilityConfig = AvailabilityConfiguration.inMemory(now);
        const inventoryConfig = InventoryConfiguration.inMemory(availabilityConfig);
        const reservationConfig = ReservationConfiguration.inMemory(inventoryConfig, availabilityConfig, now);
        inventoryFacade = inventoryConfig.facade();
        reservationFacade = reservationConfig.facade();
        availabilityFixture = new AvailabilityFixture(availabilityConfig.facade(), now);
    });

    function setupRoomWithSlots(productId: ProductIdentifier, name: string, startDate: Date, nights: number): ResourceId {
        const product = InventoryProduct.individuallyTracked(productId, name);
        const entryId = inventoryFacade.handle(CreateInventoryEntry.forProduct(product)).getSuccess();
        const resourceId = ResourceId.random();
        for (let i = 0; i < nights; i++) {
            const date = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate() + i));
            const slot = TimeSlot.ofDay(date);
            availabilityFixture.registerTemporalSlot(resourceId, slot);
        }
        const instanceId = InstanceId.random();
        inventoryFacade.mapInstanceToResource(entryId, instanceId, resourceId);
        return resourceId;
    }

    describe('Single night reservations', () => {
        it('guest can reserve room for one night', () => {
            const roomType = ProductIdentifier.random();
            setupRoomWithSlots(roomType, 'Deluxe Room', CHECK_IN, 1);
            const june15 = TimeSlot.ofDay(CHECK_IN);
            const result = reservationFacade.handle(
                ReserveRequest.forProduct(roomType)
                    .quantity(Quantity.of(1, Unit.pieces()))
                    .owner(GUEST_ANNA)
                    .purpose(ReservationPurpose.BOOKING)
                    .resourceSpecification(TemporalSpecification.of(june15))
                    .build(),
            );
            expect(result.success()).toBe(true);
            const view = reservationFacade.findById(result.getSuccess());
            expect(view).not.toBeNull();
            expect(view!.status).toBe('CONFIRMED');
        });

        it('second guest cannot reserve same room for same night', () => {
            const roomType = ProductIdentifier.random();
            setupRoomWithSlots(roomType, 'Deluxe Room', CHECK_IN, 1);
            const june15 = TimeSlot.ofDay(CHECK_IN);
            reservationFacade.handle(ReserveRequest.forProduct(roomType).quantity(Quantity.of(1, Unit.pieces())).owner(GUEST_ANNA).purpose(ReservationPurpose.BOOKING).resourceSpecification(TemporalSpecification.of(june15)).build());
            const result = reservationFacade.handle(ReserveRequest.forProduct(roomType).quantity(Quantity.of(1, Unit.pieces())).owner(GUEST_TOMEK).purpose(ReservationPurpose.BOOKING).resourceSpecification(TemporalSpecification.of(june15)).build());
            expect(result.failure()).toBe(true);
        });
    });

    describe('Multi-night reservations', () => {
        it('guest can reserve room for multiple consecutive nights', () => {
            const roomType = ProductIdentifier.random();
            setupRoomWithSlots(roomType, 'Deluxe Room', CHECK_IN, 3);
            const threeNights = [
                TimeSlot.ofDay(CHECK_IN),
                TimeSlot.ofDay(new Date(Date.UTC(2024, 5, 16))),
                TimeSlot.ofDay(new Date(Date.UTC(2024, 5, 17))),
            ];
            const result = reservationFacade.handle(
                ReserveRequest.forProduct(roomType)
                    .quantity(Quantity.of(1, Unit.pieces()))
                    .owner(GUEST_ANNA)
                    .purpose(ReservationPurpose.BOOKING)
                    .resourceSpecification(TemporalSpecification.ofList(threeNights))
                    .build(),
            );
            expect(result.success()).toBe(true);
        });

        it('reservation fails if any night in range is taken', () => {
            const roomType = ProductIdentifier.random();
            setupRoomWithSlots(roomType, 'Deluxe Room', CHECK_IN, 3);
            const june16 = TimeSlot.ofDay(new Date(Date.UTC(2024, 5, 16)));
            reservationFacade.handle(ReserveRequest.forProduct(roomType).quantity(Quantity.of(1, Unit.pieces())).owner(GUEST_ANNA).purpose(ReservationPurpose.BOOKING).resourceSpecification(TemporalSpecification.of(june16)).build());
            const threeNights = [
                TimeSlot.ofDay(CHECK_IN),
                TimeSlot.ofDay(new Date(Date.UTC(2024, 5, 16))),
                TimeSlot.ofDay(new Date(Date.UTC(2024, 5, 17))),
            ];
            const result = reservationFacade.handle(ReserveRequest.forProduct(roomType).quantity(Quantity.of(1, Unit.pieces())).owner(GUEST_TOMEK).purpose(ReservationPurpose.BOOKING).resourceSpecification(TemporalSpecification.ofList(threeNights)).build());
            expect(result.failure()).toBe(true);
        });
    });

    describe('Cancellation scenarios', () => {
        it('guest can cancel and room becomes available', () => {
            const roomType = ProductIdentifier.random();
            setupRoomWithSlots(roomType, 'Deluxe Room', CHECK_IN, 1);
            const june15 = TimeSlot.ofDay(CHECK_IN);
            const annaReservation = reservationFacade.handle(ReserveRequest.forProduct(roomType).quantity(Quantity.of(1, Unit.pieces())).owner(GUEST_ANNA).purpose(ReservationPurpose.BOOKING).resourceSpecification(TemporalSpecification.of(june15)).build()).getSuccess();
            reservationFacade.cancel(annaReservation, GUEST_ANNA);
            const tomekResult = reservationFacade.handle(ReserveRequest.forProduct(roomType).quantity(Quantity.of(1, Unit.pieces())).owner(GUEST_TOMEK).purpose(ReservationPurpose.BOOKING).resourceSpecification(TemporalSpecification.of(june15)).build());
            expect(tomekResult.success()).toBe(true);
        });
    });
});
