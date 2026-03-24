import { OwnerId } from '../availability/owner-id';
import { Reservation } from './reservation';
import { ReservationId } from './reservation-id';

export interface ReservationRepository {
    save(reservation: Reservation): void;
    findById(id: ReservationId): Reservation | null;
    findByOwner(owner: OwnerId): Reservation[];
    findActive(): Reservation[];
    delete(id: ReservationId): void;
}
