import { Result, ResultFactory } from '@softwarearchetypes/common';
import { AvailabilityFacade } from '../availability/availability-facade';
import { OwnerId } from '../availability/owner-id';
import { UnlockRequest } from '../availability/unlock-request';
import { InventoryFacade } from '../inventory-facade';
import { LockCommand } from '../lock-command';
import { Reservation } from './reservation';
import { ReservationId } from './reservation-id';
import { ReservationRepository } from './reservation-repository';
import { ReservationView } from './reservation-view';
import { ReserveRequest } from './reserve-request';

export class ReservationFacade {
    private readonly inventoryFacade: InventoryFacade;
    private readonly availabilityFacade: AvailabilityFacade;
    private readonly reservationRepository: ReservationRepository;
    private readonly _now: () => Date;

    constructor(
        inventoryFacade: InventoryFacade,
        availabilityFacade: AvailabilityFacade,
        reservationRepository: ReservationRepository,
        now: () => Date,
    ) {
        this.inventoryFacade = inventoryFacade;
        this.availabilityFacade = availabilityFacade;
        this.reservationRepository = reservationRepository;
        this._now = now;
    }

    handle(request: ReserveRequest): Result<string, ReservationId> {
        const lockCmd = new LockCommand(
            request.productId,
            request.quantity,
            request.owner,
            request.resourceSpecification,
        );

        const lockResult = this.inventoryFacade.handleLock(lockCmd);
        if (lockResult.failure()) {
            return ResultFactory.failure(lockResult.getFailure());
        }

        const now = this._now();
        const reservation = Reservation.create(
            request.owner,
            request.purpose,
            lockResult.getSuccess(),
            now,
        );

        this.reservationRepository.save(reservation);
        return ResultFactory.success(reservation.id);
    }

    cancel(reservationId: ReservationId, requester: OwnerId): Result<string, ReservationId> {
        const reservation = this.reservationRepository.findById(reservationId);
        if (reservation === null) {
            throw new Error(`Reservation not found: ${reservationId}`);
        }

        if (!reservation.owner().equals(requester)) {
            return ResultFactory.failure('Not authorized to cancel this reservation');
        }

        if (!reservation.isActive()) {
            return ResultFactory.failure('Reservation is not active');
        }

        for (const blockadeId of reservation.blockadeIds()) {
            this.availabilityFacade.handle(UnlockRequest.of(requester, blockadeId));
        }

        reservation.cancel();
        this.reservationRepository.save(reservation);

        return ResultFactory.success(reservationId);
    }

    findById(id: ReservationId): ReservationView | null {
        const reservation = this.reservationRepository.findById(id);
        return reservation ? ReservationView.from(reservation) : null;
    }

    findByOwner(owner: OwnerId): ReservationView[] {
        return this.reservationRepository.findByOwner(owner).map(r => ReservationView.from(r));
    }

    findActive(): ReservationView[] {
        return this.reservationRepository.findActive().map(r => ReservationView.from(r));
    }
}
