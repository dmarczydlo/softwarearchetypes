export class TimeSlot {
    readonly from: Date;
    readonly to: Date;

    constructor(from: Date, to: Date) {
        if (from == null) {
            throw new Error("TimeSlot 'from' cannot be null");
        }
        if (to == null) {
            throw new Error("TimeSlot 'to' cannot be null");
        }
        if (from.getTime() >= to.getTime()) {
            throw new Error("TimeSlot 'from' must be before 'to'");
        }
        this.from = from;
        this.to = to;
    }

    static of(from: Date, to: Date): TimeSlot {
        return new TimeSlot(from, to);
    }

    static ofDay(date: Date): TimeSlot {
        const start = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const end = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1));
        return new TimeSlot(start, end);
    }

    static ofLocalDate(year: number, month: number, day: number): TimeSlot {
        const start = new Date(Date.UTC(year, month - 1, day));
        const end = new Date(Date.UTC(year, month - 1, day + 1));
        return new TimeSlot(start, end);
    }

    contains(instant: Date): boolean {
        const time = instant.getTime();
        return time >= this.from.getTime() && time < this.to.getTime();
    }

    overlaps(other: TimeSlot): boolean {
        return this.from.getTime() < other.to.getTime() && other.from.getTime() < this.to.getTime();
    }

    isAdjacentTo(other: TimeSlot): boolean {
        return this.to.getTime() === other.from.getTime() || other.to.getTime() === this.from.getTime();
    }

    durationMs(): number {
        return this.to.getTime() - this.from.getTime();
    }

    equals(other: TimeSlot): boolean {
        return this.from.getTime() === other.from.getTime() && this.to.getTime() === other.to.getTime();
    }
}
