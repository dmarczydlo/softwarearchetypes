/**
 * Represents a time period during which something is valid.
 * Uses ISO date strings (YYYY-MM-DD). Both boundaries are optional.
 */
export class Validity {

    private readonly _from: string | null;
    private readonly _to: string | null;

    private constructor(from: string | null, to: string | null) {
        if (from != null && to != null && from > to) {
            throw new Error("From date must be before or equal to date");
        }
        this._from = from;
        this._to = to;
    }

    static from(from: string): Validity {
        return new Validity(from, null);
    }

    static until(to: string): Validity {
        return new Validity(null, to);
    }

    static between(from: string, to: string): Validity {
        return new Validity(from, to);
    }

    static always(): Validity {
        return new Validity(null, null);
    }

    isValidAt(date: string): boolean {
        if (date == null) return false;
        if (this._from != null && date < this._from) return false;
        if (this._to != null && date > this._to) return false;
        return true;
    }

    from(): string | null {
        return this._from;
    }

    to(): string | null {
        return this._to;
    }

    equals(other: Validity): boolean {
        return this._from === other._from && this._to === other._to;
    }

    toString(): string {
        if (this._from == null && this._to == null) return "always";
        if (this._from == null) return "until " + this._to;
        if (this._to == null) return "from " + this._from;
        return this._from + " to " + this._to;
    }
}
