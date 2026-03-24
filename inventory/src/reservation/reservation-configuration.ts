import { AvailabilityConfiguration } from '../availability/availability-configuration';
import { AvailabilityFacade } from '../availability/availability-facade';
import { InventoryConfiguration } from '../inventory-configuration';
import { InventoryFacade } from '../inventory-facade';
import { InMemoryReservationRepository } from './in-memory-reservation-repository';
import { ReservationFacade } from './reservation-facade';
import { ReservationRepository } from './reservation-repository';

export class ReservationConfiguration {
    private readonly _now: () => Date;
    private readonly _inventoryFacade: InventoryFacade;
    private readonly _availabilityFacade: AvailabilityFacade;
    private readonly _reservationRepository: ReservationRepository;
    private readonly _facade: ReservationFacade;

    constructor(
        now: () => Date,
        inventoryFacade: InventoryFacade,
        availabilityFacade: AvailabilityFacade,
        reservationRepository: ReservationRepository,
        facade: ReservationFacade,
    ) {
        this._now = now;
        this._inventoryFacade = inventoryFacade;
        this._availabilityFacade = availabilityFacade;
        this._reservationRepository = reservationRepository;
        this._facade = facade;
    }

    static inMemory(
        inventoryConfig?: InventoryConfiguration,
        availabilityConfig?: AvailabilityConfiguration,
        now?: () => Date,
    ): ReservationConfiguration {
        const clockFn = now ?? (() => new Date());
        const avConfig = availabilityConfig ?? AvailabilityConfiguration.inMemory(clockFn);
        const invConfig = inventoryConfig ?? InventoryConfiguration.inMemory(avConfig);
        const reservationRepository = new InMemoryReservationRepository();
        const facade = new ReservationFacade(
            invConfig.facade(),
            avConfig.facade(),
            reservationRepository,
            clockFn,
        );
        return new ReservationConfiguration(
            clockFn,
            invConfig.facade(),
            avConfig.facade(),
            reservationRepository,
            facade,
        );
    }

    facade(): ReservationFacade { return this._facade; }
    inventoryFacade(): InventoryFacade { return this._inventoryFacade; }
    availabilityFacade(): AvailabilityFacade { return this._availabilityFacade; }
    now(): () => Date { return this._now; }
}
