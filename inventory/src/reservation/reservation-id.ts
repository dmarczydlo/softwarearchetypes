import { randomUUID } from 'crypto';

export class ReservationId {
    readonly id: string;

    constructor(id: string) {
        if (id == null) throw new Error('ReservationId cannot be null');
        this.id = id;
    }

    static random(): ReservationId {
        return new ReservationId(randomUUID());
    }

    static of(id: string): ReservationId {
        return new ReservationId(id);
    }

    equals(other: ReservationId): boolean {
        return this.id === other.id;
    }

    toString(): string {
        return this.id;
    }
}
