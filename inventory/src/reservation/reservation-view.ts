import { BlockadeId } from '../availability/blockade-id';
import { OwnerId } from '../availability/owner-id';
import { Reservation } from './reservation';
import { ReservationId } from './reservation-id';
import { ReservationPurpose } from './reservation-purpose';

export class ReservationView {
    readonly id: ReservationId;
    readonly owner: OwnerId;
    readonly purpose: ReservationPurpose;
    readonly blockadeIds: BlockadeId[];
    readonly createdAt: Date;
    readonly status: string;

    constructor(
        id: ReservationId,
        owner: OwnerId,
        purpose: ReservationPurpose,
        blockadeIds: BlockadeId[],
        createdAt: Date,
        status: string,
    ) {
        this.id = id;
        this.owner = owner;
        this.purpose = purpose;
        this.blockadeIds = blockadeIds;
        this.createdAt = createdAt;
        this.status = status;
    }

    static from(reservation: Reservation): ReservationView {
        return new ReservationView(
            reservation.id,
            reservation.owner(),
            reservation.purpose(),
            reservation.blockadeIds(),
            reservation.createdAt(),
            reservation.status(),
        );
    }
}
