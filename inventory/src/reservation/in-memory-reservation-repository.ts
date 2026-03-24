import { OwnerId } from '../availability/owner-id';
import { Reservation } from './reservation';
import { ReservationId } from './reservation-id';
import { ReservationRepository } from './reservation-repository';

export class InMemoryReservationRepository implements ReservationRepository {
    private readonly storage = new Map<string, Reservation>();

    save(reservation: Reservation): void {
        this.storage.set(reservation.id.id, reservation);
    }

    findById(id: ReservationId): Reservation | null {
        return this.storage.get(id.id) ?? null;
    }

    findByOwner(owner: OwnerId): Reservation[] {
        return [...this.storage.values()].filter(r => r.owner().equals(owner));
    }

    findActive(): Reservation[] {
        return [...this.storage.values()].filter(r => r.isActive());
    }

    delete(id: ReservationId): void {
        this.storage.delete(id.id);
    }
}
