import { describe, it, expect, beforeEach } from 'vitest';
import { Quantity, Unit } from '@softwarearchetypes/quantity';
import { AvailabilityConfiguration } from './availability-configuration';
import { AvailabilityFacade } from './availability-facade';
import { PoolResourceAvailability } from './pool-resource-availability';
import { PoolLockRequest } from './lock-request';
import { ResourceId } from './resource-id';
import { OwnerId } from './owner-id';
import { UnlockRequest } from './unlock-request';

describe('Fuel Station Scenarios (Pool Availability)', () => {
    const LITERS = Unit.liters();
    const PETROL_95_TANK = ResourceId.random();
    const DIESEL_TANK = ResourceId.random();
    const FLEET_COMPANY_A = OwnerId.random();
    const FLEET_COMPANY_B = OwnerId.random();
    const TAXI_CORPORATION = OwnerId.random();

    let now: () => Date;
    let facade: AvailabilityFacade;

    beforeEach(() => {
        now = () => new Date('2024-03-15T10:00:00Z');
        facade = AvailabilityConfiguration.inMemory(now).facade();
    });

    describe('Reserving fuel', () => {
        it('fleet can reserve available fuel', () => {
            const petrolTank = PoolResourceAvailability.create(PETROL_95_TANK, Quantity.of(5000, LITERS), now);
            facade.register(petrolTank);
            const reservation = PoolLockRequest.indefinite(PETROL_95_TANK, Quantity.of(500, LITERS), FLEET_COMPANY_A);
            const result = facade.lockPool(PETROL_95_TANK, reservation);
            expect(result.success()).toBe(true);
            expect(facade.isAvailable(petrolTank.id())).toBe(true);
        });

        it('multiple fleet companies can reserve from same tank', () => {
            const dieselTank = PoolResourceAvailability.create(DIESEL_TANK, Quantity.of(10000, LITERS), now);
            facade.register(dieselTank);
            const fleetAResult = facade.lockPool(DIESEL_TANK, PoolLockRequest.indefinite(DIESEL_TANK, Quantity.of(2000, LITERS), FLEET_COMPANY_A));
            const fleetBResult = facade.lockPool(DIESEL_TANK, PoolLockRequest.indefinite(DIESEL_TANK, Quantity.of(1500, LITERS), FLEET_COMPANY_B));
            const taxiResult = facade.lockPool(DIESEL_TANK, PoolLockRequest.indefinite(DIESEL_TANK, Quantity.of(3000, LITERS), TAXI_CORPORATION));
            expect(fleetAResult.success()).toBe(true);
            expect(fleetBResult.success()).toBe(true);
            expect(taxiResult.success()).toBe(true);
        });

        it('reservation fails when requesting more than available', () => {
            const smallTank = PoolResourceAvailability.create(PETROL_95_TANK, Quantity.of(1000, LITERS), now);
            facade.register(smallTank);
            const result = facade.lockPool(PETROL_95_TANK, PoolLockRequest.indefinite(PETROL_95_TANK, Quantity.of(1500, LITERS), FLEET_COMPANY_A));
            expect(result.failure()).toBe(true);
            expect(result.getFailure()).toContain('Insufficient quantity');
        });

        it('reservation fails when tank exhausted by previous reservations', () => {
            const tank = PoolResourceAvailability.create(DIESEL_TANK, Quantity.of(5000, LITERS), now);
            facade.register(tank);
            facade.lockPool(DIESEL_TANK, PoolLockRequest.indefinite(DIESEL_TANK, Quantity.of(4000, LITERS), FLEET_COMPANY_A));
            const result = facade.lockPool(DIESEL_TANK, PoolLockRequest.indefinite(DIESEL_TANK, Quantity.of(1500, LITERS), FLEET_COMPANY_B));
            expect(result.failure()).toBe(true);
            expect(result.getFailure()).toContain('Insufficient');
        });

        it('same company can make multiple reservations', () => {
            const tank = PoolResourceAvailability.create(PETROL_95_TANK, Quantity.of(5000, LITERS), now);
            facade.register(tank);
            const firstVehicle = facade.lockPool(PETROL_95_TANK, PoolLockRequest.indefinite(PETROL_95_TANK, Quantity.of(200, LITERS), FLEET_COMPANY_A));
            const secondVehicle = facade.lockPool(PETROL_95_TANK, PoolLockRequest.indefinite(PETROL_95_TANK, Quantity.of(300, LITERS), FLEET_COMPANY_A));
            expect(firstVehicle.success()).toBe(true);
            expect(secondVehicle.success()).toBe(true);
            expect(firstVehicle.getSuccess().equals(secondVehicle.getSuccess())).toBe(false);
        });
    });

    describe('Cancelling reservations', () => {
        it('company can cancel their fuel reservation', () => {
            const tank = PoolResourceAvailability.create(PETROL_95_TANK, Quantity.of(5000, LITERS), now);
            facade.register(tank);
            const reservationId = facade.lockPool(PETROL_95_TANK, PoolLockRequest.indefinite(PETROL_95_TANK, Quantity.of(1000, LITERS), FLEET_COMPANY_A)).getSuccess();
            const result = facade.unlock(tank.id(), UnlockRequest.of(FLEET_COMPANY_A, reservationId));
            expect(result.success()).toBe(true);
        });

        it('company cannot cancel another company reservation', () => {
            const tank = PoolResourceAvailability.create(DIESEL_TANK, Quantity.of(5000, LITERS), now);
            facade.register(tank);
            const reservationId = facade.lockPool(DIESEL_TANK, PoolLockRequest.indefinite(DIESEL_TANK, Quantity.of(2000, LITERS), FLEET_COMPANY_A)).getSuccess();
            const result = facade.unlock(tank.id(), UnlockRequest.of(FLEET_COMPANY_B, reservationId));
            expect(result.failure()).toBe(true);
            expect(result.getFailure()).toContain('not the owner');
        });

        it('cancelled fuel becomes available for others', () => {
            const tank = PoolResourceAvailability.create(PETROL_95_TANK, Quantity.of(5000, LITERS), now);
            facade.register(tank);
            const fleetAReservation = facade.lockPool(PETROL_95_TANK, PoolLockRequest.indefinite(PETROL_95_TANK, Quantity.of(4000, LITERS), FLEET_COMPANY_A)).getSuccess();
            expect(facade.lockPool(PETROL_95_TANK, PoolLockRequest.indefinite(PETROL_95_TANK, Quantity.of(1500, LITERS), FLEET_COMPANY_B)).failure()).toBe(true);
            facade.unlock(tank.id(), UnlockRequest.of(FLEET_COMPANY_A, fleetAReservation));
            const result = facade.lockPool(PETROL_95_TANK, PoolLockRequest.indefinite(PETROL_95_TANK, Quantity.of(1500, LITERS), FLEET_COMPANY_B));
            expect(result.success()).toBe(true);
        });
    });

    describe('Tank capacity edge cases', () => {
        it('company can reserve exact remaining fuel', () => {
            const tank = PoolResourceAvailability.create(DIESEL_TANK, Quantity.of(5000, LITERS), now);
            facade.register(tank);
            facade.lockPool(DIESEL_TANK, PoolLockRequest.indefinite(DIESEL_TANK, Quantity.of(4800, LITERS), FLEET_COMPANY_A));
            const result = facade.lockPool(DIESEL_TANK, PoolLockRequest.indefinite(DIESEL_TANK, Quantity.of(200, LITERS), TAXI_CORPORATION));
            expect(result.success()).toBe(true);
        });

        it('tank shows as unavailable when fully reserved', () => {
            const tank = PoolResourceAvailability.create(PETROL_95_TANK, Quantity.of(3000, LITERS), now);
            facade.register(tank);
            facade.lockPool(PETROL_95_TANK, PoolLockRequest.indefinite(PETROL_95_TANK, Quantity.of(3000, LITERS), FLEET_COMPANY_A));
            expect(facade.isAvailable(tank.id())).toBe(false);
        });

        it('multiple small reservations can fill the tank', () => {
            const tank = PoolResourceAvailability.create(PETROL_95_TANK, Quantity.of(1000, LITERS), now);
            facade.register(tank);
            facade.lockPool(PETROL_95_TANK, PoolLockRequest.indefinite(PETROL_95_TANK, Quantity.of(300, LITERS), FLEET_COMPANY_A));
            facade.lockPool(PETROL_95_TANK, PoolLockRequest.indefinite(PETROL_95_TANK, Quantity.of(400, LITERS), FLEET_COMPANY_B));
            const lastReservation = facade.lockPool(PETROL_95_TANK, PoolLockRequest.indefinite(PETROL_95_TANK, Quantity.of(300, LITERS), TAXI_CORPORATION));
            expect(lastReservation.success()).toBe(true);
            expect(facade.isAvailable(tank.id())).toBe(false);
            expect(facade.lockPool(PETROL_95_TANK, PoolLockRequest.indefinite(PETROL_95_TANK, Quantity.of(1, LITERS), FLEET_COMPANY_A)).failure()).toBe(true);
        });
    });
});
