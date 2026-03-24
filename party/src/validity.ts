export class Validity {
    static readonly ALWAYS = new Validity(new Date(0), new Date(8640000000000000));

    constructor(
        public readonly validFrom: Date,
        public readonly validTo: Date
    ) {}

    static until(validTo: Date): Validity {
        return new Validity(new Date(0), validTo);
    }

    static from(validFrom: Date): Validity {
        return new Validity(validFrom, new Date(8640000000000000));
    }

    static between(validFrom: Date | null, validTo: Date | null): Validity {
        if (validFrom === null && validTo === null) {
            return Validity.ALWAYS;
        }
        if (validFrom === null) {
            return Validity.until(validTo!);
        }
        if (validTo === null) {
            return Validity.from(validFrom);
        }
        return new Validity(validFrom, validTo);
    }

    static always(): Validity {
        return Validity.ALWAYS;
    }

    isValidAt(instant: Date): boolean {
        return instant.getTime() >= this.validFrom.getTime() && instant.getTime() < this.validTo.getTime();
    }

    hasExpired(instant: Date): boolean {
        return instant.getTime() >= this.validTo.getTime();
    }

    isCurrentlyValid(): boolean {
        return this.isValidAt(new Date());
    }

    overlaps(other: Validity): boolean {
        return this.validFrom.getTime() < other.validTo.getTime() && other.validFrom.getTime() < this.validTo.getTime();
    }
}
