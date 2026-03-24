import { Reservation } from './Reservation.js';

export class BridgingReservations {
    readonly reservations: ReadonlySet<Reservation>;

    constructor(reservations: Set<Reservation>) {
        this.reservations = new Set(reservations);
    }

    isBridging(reservation: Reservation): boolean {
        for (const r of this.reservations) {
            if (r.equals(reservation)) {
                return true;
            }
        }
        return false;
    }

    count(): number {
        return this.reservations.size;
    }

    isEmpty(): boolean {
        return this.reservations.size === 0;
    }
}
