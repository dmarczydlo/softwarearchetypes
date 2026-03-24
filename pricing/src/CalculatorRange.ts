import { CalculatorId } from "./CalculatorId.js";

export interface CalculatorRange {
    supports(value: unknown): boolean;
    contains(value: unknown): boolean;
    calculatorId(): CalculatorId;
    isCompatibleWith(other: CalculatorRange): boolean;
    overlaps(other: CalculatorRange): boolean;
    describe(): string;
}

export namespace CalculatorRange {
    export function numeric(min: number, max: number, calculatorId: CalculatorId): NumericRange {
        return new NumericRange(min, max, calculatorId);
    }

    export function time(from: TimeOfDay, to: TimeOfDay, calculatorId: CalculatorId): TimeRange {
        return new TimeRange(from, to, calculatorId);
    }

    export function date(from: Date, to: Date, calculatorId: CalculatorId): DateRange {
        return new DateRange(from, to, calculatorId);
    }
}

// ============================================================================
// TimeOfDay helper (replaces Java LocalTime)
// ============================================================================

export class TimeOfDay {
    readonly hour: number;
    readonly minute: number;

    constructor(hour: number, minute: number) {
        this.hour = hour;
        this.minute = minute;
    }

    static of(hour: number, minute: number): TimeOfDay {
        return new TimeOfDay(hour, minute);
    }

    toMinutes(): number {
        return this.hour * 60 + this.minute;
    }

    isBefore(other: TimeOfDay): boolean {
        return this.toMinutes() < other.toMinutes();
    }

    compareTo(other: TimeOfDay): number {
        return this.toMinutes() - other.toMinutes();
    }

    toString(): string {
        return `${String(this.hour).padStart(2, "0")}:${String(this.minute).padStart(2, "0")}`;
    }

    equals(other: TimeOfDay): boolean {
        return this.hour === other.hour && this.minute === other.minute;
    }
}

// ============================================================================
// DateRange
// ============================================================================

export class DateRange implements CalculatorRange {
    readonly from: Date;
    readonly to: Date;
    private readonly _calculatorId: CalculatorId;

    constructor(from: Date, to: Date, calculatorId: CalculatorId) {
        if (from.getTime() >= to.getTime()) {
            throw new Error(`From must be before to: [${formatDate(from)}, ${formatDate(to)})`);
        }
        this.from = from;
        this.to = to;
        this._calculatorId = calculatorId;
    }

    supports(value: unknown): boolean {
        return value instanceof Date;
    }

    contains(value: unknown): boolean {
        if (!this.supports(value)) return false;
        const date = value as Date;
        return date.getTime() >= this.from.getTime() && date.getTime() < this.to.getTime();
    }

    calculatorId(): CalculatorId {
        return this._calculatorId;
    }

    isCompatibleWith(other: CalculatorRange): boolean {
        return other instanceof DateRange;
    }

    overlaps(other: CalculatorRange): boolean {
        if (!this.isCompatibleWith(other)) {
            throw new Error(`Cannot check overlap with incompatible range type: ${other.constructor.name}`);
        }
        const o = other as DateRange;
        return !(this.to.getTime() <= o.from.getTime()) && !(o.to.getTime() <= this.from.getTime());
    }

    describe(): string {
        return `[${formatDate(this.from)}, ${formatDate(this.to)})`;
    }

    toString(): string {
        return `[${formatDate(this.from)}, ${formatDate(this.to)}) -> ${this._calculatorId}`;
    }
}

// ============================================================================
// NumericRange
// ============================================================================

export class NumericRange implements CalculatorRange {
    readonly min: number;
    readonly max: number;
    private readonly _calculatorId: CalculatorId;

    constructor(min: number, max: number, calculatorId: CalculatorId) {
        if (min >= max) {
            throw new Error(`Min must be less than max: [${min}, ${max})`);
        }
        this.min = min;
        this.max = max;
        this._calculatorId = calculatorId;
    }

    supports(value: unknown): boolean {
        return typeof value === "number";
    }

    contains(value: unknown): boolean {
        if (!this.supports(value)) return false;
        const num = value as number;
        return num >= this.min && num < this.max;
    }

    calculatorId(): CalculatorId {
        return this._calculatorId;
    }

    isCompatibleWith(other: CalculatorRange): boolean {
        return other instanceof NumericRange;
    }

    overlaps(other: CalculatorRange): boolean {
        if (!this.isCompatibleWith(other)) {
            throw new Error(`Cannot check overlap with incompatible range type: ${other.constructor.name}`);
        }
        const o = other as NumericRange;
        return !(this.max <= o.min) && !(o.max <= this.min);
    }

    describe(): string {
        return `[${this.min}, ${this.max})`;
    }

    toString(): string {
        return `[${this.min}, ${this.max}) -> ${this._calculatorId}`;
    }
}

// ============================================================================
// TimeRange
// ============================================================================

export class TimeRange implements CalculatorRange {
    readonly from: TimeOfDay;
    readonly to: TimeOfDay;
    private readonly _calculatorId: CalculatorId;

    constructor(from: TimeOfDay, to: TimeOfDay, calculatorId: CalculatorId) {
        this.from = from;
        this.to = to;
        this._calculatorId = calculatorId;
    }

    supports(value: unknown): boolean {
        return value instanceof TimeOfDay;
    }

    contains(value: unknown): boolean {
        if (!this.supports(value)) return false;
        const time = value as TimeOfDay;

        if (this.from.isBefore(this.to)) {
            return time.toMinutes() >= this.from.toMinutes() && time.toMinutes() < this.to.toMinutes();
        } else {
            return time.toMinutes() >= this.from.toMinutes() || time.toMinutes() < this.to.toMinutes();
        }
    }

    calculatorId(): CalculatorId {
        return this._calculatorId;
    }

    isCompatibleWith(other: CalculatorRange): boolean {
        return other instanceof TimeRange;
    }

    overlaps(other: CalculatorRange): boolean {
        if (!this.isCompatibleWith(other)) {
            throw new Error(`Cannot check overlap with incompatible range type: ${other.constructor.name}`);
        }
        const o = other as TimeRange;

        const thisNormal = this.from.isBefore(this.to);
        const otherNormal = o.from.isBefore(o.to);

        if (thisNormal && otherNormal) {
            return !(this.to.compareTo(o.from) <= 0) && !(o.to.compareTo(this.from) <= 0);
        }

        if (!thisNormal && otherNormal) {
            const otherInGap = o.from.compareTo(this.to) >= 0 && o.to.compareTo(this.from) <= 0;
            return !otherInGap;
        }

        if (thisNormal && !otherNormal) {
            const thisInGap = this.from.compareTo(o.to) >= 0 && this.to.compareTo(o.from) <= 0;
            return !thisInGap;
        }

        return true;
    }

    describe(): string {
        if (this.from.isBefore(this.to)) {
            return `[${this.from}, ${this.to})`;
        }
        return `[${this.from}, ${this.to}) (crosses midnight)`;
    }

    toString(): string {
        if (this.from.isBefore(this.to)) {
            return `[${this.from}, ${this.to}) -> ${this._calculatorId}`;
        }
        return `[${this.from}, ${this.to}) (crosses midnight) -> ${this._calculatorId}`;
    }
}

function formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
