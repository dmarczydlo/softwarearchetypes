import { describe, it, expect } from 'vitest';
import { Quantity, Unit } from '@softwarearchetypes/quantity';
import { AvailabilityConfiguration } from '../availability/availability-configuration';
import { AvailabilityFixture } from '../availability/availability-fixture';
import { OwnerId } from '../availability/owner-id';
import { ResourceId } from '../availability/resource-id';
import { CreateInventoryEntry } from '../create-inventory-entry';
import { InstanceId } from '../instance-id';
import { InventoryConfiguration } from '../inventory-configuration';
import { InventoryFacade } from '../inventory-facade';
import { InventoryProduct } from '../inventory-product';
import { ProductIdentifier } from '../product-identifier';
import { IndividualSpecification } from '../resource-specification';
import { ReservationConfiguration } from './reservation-configuration';
import { ReservationFacade } from './reservation-facade';
import { ReservationPurpose } from './reservation-purpose';
import { ReserveRequest } from './reserve-request';

describe('ReservationFacade', () => {
    const GUEST_ALICE = OwnerId.random();
    const GUEST_BOB = OwnerId.random();

    function createFacades() {
        const now = () => new Date('2024-01-15T10:00:00Z');
        const availabilityConfig = AvailabilityConfiguration.inMemory(now);
        const inventoryConfig = InventoryConfiguration.inMemory(availabilityConfig);
        const reservationConfig = ReservationConfiguration.inMemory(inventoryConfig, availabilityConfig, now);
        return {
            reservationFacade: reservationConfig.facade(),
            inventoryFacade: inventoryConfig.facade(),
            availabilityFixture: new AvailabilityFixture(availabilityConfig.facade(), now),
        };
    }

    function setupProductWithResource(
        inventoryFacade: InventoryFacade,
        availabilityFixture: AvailabilityFixture,
        productId: ProductIdentifier,
        name: string,
    ): InstanceId {
        const product = InventoryProduct.individuallyTracked(productId, name);
        const entryId = inventoryFacade.handle(CreateInventoryEntry.forProduct(product)).getSuccess();
        const resourceId = ResourceId.random();
        availabilityFixture.registerIndividual(resourceId);
        const instanceId = InstanceId.random();
        inventoryFacade.mapInstanceToResource(entryId, instanceId, resourceId);
        return instanceId;
    }

    it('creates reservation when resource available', () => {
        const { reservationFacade, inventoryFacade, availabilityFixture } = createFacades();
        const productId = ProductIdentifier.random();
        const instanceId = setupProductWithResource(inventoryFacade, availabilityFixture, productId, 'Laptop');
        const request = ReserveRequest.forProduct(productId)
            .quantity(Quantity.of(1, Unit.pieces()))
            .owner(GUEST_ALICE)
            .purpose(ReservationPurpose.BOOKING)
            .resourceSpecification(IndividualSpecification.of(instanceId))
            .build();
        const result = reservationFacade.handle(request);
        expect(result.success()).toBe(true);
        const view = reservationFacade.findById(result.getSuccess());
        expect(view).not.toBeNull();
        expect(view!.owner.equals(GUEST_ALICE)).toBe(true);
        expect(view!.status).toBe('CONFIRMED');
        expect(view!.purpose).toBe(ReservationPurpose.BOOKING);
    });

    it('fails reservation when resource unavailable', () => {
        const { reservationFacade, inventoryFacade, availabilityFixture } = createFacades();
        const productId = ProductIdentifier.random();
        const instanceId = setupProductWithResource(inventoryFacade, availabilityFixture, productId, 'Laptop');
        reservationFacade.handle(ReserveRequest.forProduct(productId)
            .quantity(Quantity.of(1, Unit.pieces()))
            .owner(GUEST_ALICE)
            .purpose(ReservationPurpose.BOOKING)
            .resourceSpecification(IndividualSpecification.of(instanceId))
            .build());
        const result = reservationFacade.handle(ReserveRequest.forProduct(productId)
            .quantity(Quantity.of(1, Unit.pieces()))
            .owner(GUEST_BOB)
            .purpose(ReservationPurpose.BOOKING)
            .resourceSpecification(IndividualSpecification.of(instanceId))
            .build());
        expect(result.failure()).toBe(true);
    });

    it('owner can cancel reservation', () => {
        const { reservationFacade, inventoryFacade, availabilityFixture } = createFacades();
        const productId = ProductIdentifier.random();
        const instanceId = setupProductWithResource(inventoryFacade, availabilityFixture, productId, 'Laptop');
        const reserveResult = reservationFacade.handle(ReserveRequest.forProduct(productId)
            .quantity(Quantity.of(1, Unit.pieces()))
            .owner(GUEST_ALICE)
            .purpose(ReservationPurpose.BOOKING)
            .resourceSpecification(IndividualSpecification.of(instanceId))
            .build());
        const reservationId = reserveResult.getSuccess();
        const cancelResult = reservationFacade.cancel(reservationId, GUEST_ALICE);
        expect(cancelResult.success()).toBe(true);
        const cancelled = reservationFacade.findById(reservationId);
        expect(cancelled).not.toBeNull();
        expect(cancelled!.status).toBe('CANCELLED');
    });

    it('cancellation releases resource', () => {
        const { reservationFacade, inventoryFacade, availabilityFixture } = createFacades();
        const productId = ProductIdentifier.random();
        const instanceId = setupProductWithResource(inventoryFacade, availabilityFixture, productId, 'Laptop');
        const reserveResult = reservationFacade.handle(ReserveRequest.forProduct(productId)
            .quantity(Quantity.of(1, Unit.pieces()))
            .owner(GUEST_ALICE)
            .purpose(ReservationPurpose.BOOKING)
            .resourceSpecification(IndividualSpecification.of(instanceId))
            .build());
        const reservationId = reserveResult.getSuccess();
        reservationFacade.cancel(reservationId, GUEST_ALICE);
        const bobResult = reservationFacade.handle(ReserveRequest.forProduct(productId)
            .quantity(Quantity.of(1, Unit.pieces()))
            .owner(GUEST_BOB)
            .purpose(ReservationPurpose.BOOKING)
            .resourceSpecification(IndividualSpecification.of(instanceId))
            .build());
        expect(bobResult.success()).toBe(true);
    });

    it('non-owner cannot cancel reservation', () => {
        const { reservationFacade, inventoryFacade, availabilityFixture } = createFacades();
        const productId = ProductIdentifier.random();
        const instanceId = setupProductWithResource(inventoryFacade, availabilityFixture, productId, 'Laptop');
        const reserveResult = reservationFacade.handle(ReserveRequest.forProduct(productId)
            .quantity(Quantity.of(1, Unit.pieces()))
            .owner(GUEST_ALICE)
            .purpose(ReservationPurpose.BOOKING)
            .resourceSpecification(IndividualSpecification.of(instanceId))
            .build());
        const reservationId = reserveResult.getSuccess();
        const cancelResult = reservationFacade.cancel(reservationId, GUEST_BOB);
        expect(cancelResult.failure()).toBe(true);
        expect(cancelResult.getFailure()).toContain('Not authorized');
    });

    it('finds reservations by owner', () => {
        const { reservationFacade, inventoryFacade, availabilityFixture } = createFacades();
        const productId1 = ProductIdentifier.random();
        const productId2 = ProductIdentifier.random();
        const instanceId1 = setupProductWithResource(inventoryFacade, availabilityFixture, productId1, 'Laptop 1');
        const instanceId2 = setupProductWithResource(inventoryFacade, availabilityFixture, productId2, 'Laptop 2');
        reservationFacade.handle(ReserveRequest.forProduct(productId1)
            .quantity(Quantity.of(1, Unit.pieces()))
            .owner(GUEST_ALICE)
            .purpose(ReservationPurpose.BOOKING)
            .resourceSpecification(IndividualSpecification.of(instanceId1))
            .build());
        reservationFacade.handle(ReserveRequest.forProduct(productId2)
            .quantity(Quantity.of(1, Unit.pieces()))
            .owner(GUEST_ALICE)
            .purpose(ReservationPurpose.BOOKING)
            .resourceSpecification(IndividualSpecification.of(instanceId2))
            .build());
        const aliceReservations = reservationFacade.findByOwner(GUEST_ALICE);
        expect(aliceReservations).toHaveLength(2);
        expect(aliceReservations.every(r => r.owner.equals(GUEST_ALICE))).toBe(true);
    });

    it('finds active reservations', () => {
        const { reservationFacade, inventoryFacade, availabilityFixture } = createFacades();
        const productId1 = ProductIdentifier.random();
        const productId2 = ProductIdentifier.random();
        const instanceId1 = setupProductWithResource(inventoryFacade, availabilityFixture, productId1, 'Laptop 1');
        const instanceId2 = setupProductWithResource(inventoryFacade, availabilityFixture, productId2, 'Laptop 2');
        const res1 = reservationFacade.handle(ReserveRequest.forProduct(productId1)
            .quantity(Quantity.of(1, Unit.pieces()))
            .owner(GUEST_ALICE)
            .purpose(ReservationPurpose.BOOKING)
            .resourceSpecification(IndividualSpecification.of(instanceId1))
            .build());
        reservationFacade.handle(ReserveRequest.forProduct(productId2)
            .quantity(Quantity.of(1, Unit.pieces()))
            .owner(GUEST_BOB)
            .purpose(ReservationPurpose.BOOKING)
            .resourceSpecification(IndividualSpecification.of(instanceId2))
            .build());
        reservationFacade.cancel(res1.getSuccess(), GUEST_ALICE);
        const activeReservations = reservationFacade.findActive();
        expect(activeReservations).toHaveLength(1);
        expect(activeReservations[0].owner.equals(GUEST_BOB)).toBe(true);
    });
});
