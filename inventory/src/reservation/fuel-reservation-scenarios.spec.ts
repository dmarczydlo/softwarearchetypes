import { describe, it, expect, beforeEach } from 'vitest';
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
import { QuantitySpecification } from '../resource-specification';
import { ReservationConfiguration } from './reservation-configuration';
import { ReservationFacade } from './reservation-facade';
import { ReservationPurpose } from './reservation-purpose';
import { ReserveRequest } from './reserve-request';

describe('Fuel Reservation Scenarios (Pool)', () => {
    const LITERS = Unit.liters();
    const FLEET_COMPANY_A = OwnerId.random();
    const FLEET_COMPANY_B = OwnerId.random();
    const TAXI_CORPORATION = OwnerId.random();

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

    function setupFuelTank(productId: ProductIdentifier, name: string, capacity: Quantity): void {
        const product = InventoryProduct.identical(productId, name);
        const entryId = inventoryFacade.handle(CreateInventoryEntry.forProduct(product)).getSuccess();
        const resourceId = ResourceId.random();
        availabilityFixture.registerPool(resourceId, capacity);
        const instanceId = InstanceId.random();
        inventoryFacade.mapInstanceToResource(entryId, instanceId, resourceId);
    }

    describe('Basic fuel reservations', () => {
        it('fleet can reserve fuel from available tank', () => {
            const diesel = ProductIdentifier.random();
            setupFuelTank(diesel, 'Diesel ON', Quantity.of(10000, LITERS));
            const result = reservationFacade.handle(
                ReserveRequest.forProduct(diesel)
                    .quantity(Quantity.of(500, LITERS))
                    .owner(FLEET_COMPANY_A)
                    .purpose(ReservationPurpose.BOOKING)
                    .resourceSpecification(QuantitySpecification.instance())
                    .build(),
            );
            expect(result.isSuccess()).toBe(true);
            const view = reservationFacade.findById(result.getSuccess());
            expect(view).not.toBeNull();
            expect(view!.status).toBe('CONFIRMED');
        });

        it('multiple fleets can reserve from same tank', () => {
            const diesel = ProductIdentifier.random();
            setupFuelTank(diesel, 'Diesel ON', Quantity.of(10000, LITERS));
            const fleetA = reservationFacade.handle(ReserveRequest.forProduct(diesel).quantity(Quantity.of(2000, LITERS)).owner(FLEET_COMPANY_A).purpose(ReservationPurpose.BOOKING).resourceSpecification(QuantitySpecification.instance()).build());
            const fleetB = reservationFacade.handle(ReserveRequest.forProduct(diesel).quantity(Quantity.of(3000, LITERS)).owner(FLEET_COMPANY_B).purpose(ReservationPurpose.BOOKING).resourceSpecification(QuantitySpecification.instance()).build());
            const taxi = reservationFacade.handle(ReserveRequest.forProduct(diesel).quantity(Quantity.of(1500, LITERS)).owner(TAXI_CORPORATION).purpose(ReservationPurpose.BOOKING).resourceSpecification(QuantitySpecification.instance()).build());
            expect(fleetA.isSuccess()).toBe(true);
            expect(fleetB.isSuccess()).toBe(true);
            expect(taxi.isSuccess()).toBe(true);
        });

        it('reservation fails when requesting more than available', () => {
            const petrol = ProductIdentifier.random();
            setupFuelTank(petrol, 'Petrol 95', Quantity.of(1000, LITERS));
            const result = reservationFacade.handle(ReserveRequest.forProduct(petrol).quantity(Quantity.of(1500, LITERS)).owner(FLEET_COMPANY_A).purpose(ReservationPurpose.BOOKING).resourceSpecification(QuantitySpecification.instance()).build());
            expect(result.isFailure()).toBe(true);
        });
    });

    describe('Cancellation scenarios', () => {
        it('cancelled reservation releases fuel for others', () => {
            const diesel = ProductIdentifier.random();
            setupFuelTank(diesel, 'Diesel ON', Quantity.of(5000, LITERS));
            const fleetAReservation = reservationFacade.handle(ReserveRequest.forProduct(diesel).quantity(Quantity.of(4500, LITERS)).owner(FLEET_COMPANY_A).purpose(ReservationPurpose.BOOKING).resourceSpecification(QuantitySpecification.instance()).build()).getSuccess();
            expect(reservationFacade.handle(ReserveRequest.forProduct(diesel).quantity(Quantity.of(1000, LITERS)).owner(FLEET_COMPANY_B).purpose(ReservationPurpose.BOOKING).resourceSpecification(QuantitySpecification.instance()).build()).isFailure()).toBe(true);
            reservationFacade.cancel(fleetAReservation, FLEET_COMPANY_A);
            const result = reservationFacade.handle(ReserveRequest.forProduct(diesel).quantity(Quantity.of(1000, LITERS)).owner(FLEET_COMPANY_B).purpose(ReservationPurpose.BOOKING).resourceSpecification(QuantitySpecification.instance()).build());
            expect(result.isSuccess()).toBe(true);
        });
    });

    describe('Query scenarios', () => {
        it('can find all reservations by owner', () => {
            const diesel = ProductIdentifier.random();
            const petrol = ProductIdentifier.random();
            setupFuelTank(diesel, 'Diesel ON', Quantity.of(10000, LITERS));
            setupFuelTank(petrol, 'Petrol 95', Quantity.of(5000, LITERS));
            reservationFacade.handle(ReserveRequest.forProduct(diesel).quantity(Quantity.of(1000, LITERS)).owner(FLEET_COMPANY_A).purpose(ReservationPurpose.BOOKING).resourceSpecification(QuantitySpecification.instance()).build());
            reservationFacade.handle(ReserveRequest.forProduct(petrol).quantity(Quantity.of(500, LITERS)).owner(FLEET_COMPANY_A).purpose(ReservationPurpose.BOOKING).resourceSpecification(QuantitySpecification.instance()).build());
            const fleetAReservations = reservationFacade.findByOwner(FLEET_COMPANY_A);
            expect(fleetAReservations).toHaveLength(2);
            expect(fleetAReservations.every(r => r.owner.equals(FLEET_COMPANY_A))).toBe(true);
        });
    });
});
