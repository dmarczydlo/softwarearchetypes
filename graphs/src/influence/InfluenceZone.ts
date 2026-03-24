import { Reservation } from './Reservation.js';

export class InfluenceZone {
    readonly reservations: ReadonlySet<Reservation>;

    constructor(reservations: Set<Reservation>) {
        this.reservations = new Set(reservations);
    }

    countReservationsToNegotiateWith(reservation: Reservation): number {
        if (!this.contains(reservation)) {
            return 0;
        }
        return this.reservations.size - 1;
    }

    getReservationsToNegotiateWith(reservation: Reservation): Set<Reservation> {
        if (!this.contains(reservation)) {
            return new Set();
        }
        const result = new Set<Reservation>();
        for (const r of this.reservations) {
            if (!r.equals(reservation)) {
                result.add(r);
            }
        }
        return result;
    }

    size(): number {
        return this.reservations.size;
    }

    private contains(reservation: Reservation): boolean {
        for (const r of this.reservations) {
            if (r.equals(reservation)) {
                return true;
            }
        }
        return false;
    }
}
