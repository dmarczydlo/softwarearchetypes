const MIN_DATE = new Date(-8640000000000000);
const MAX_DATE = new Date(8640000000000000);

export class Validity {
    readonly validFrom: Date;
    readonly validTo: Date;

    constructor(validFrom: Date, validTo: Date) {
        this.validFrom = validFrom;
        this.validTo = validTo;
    }

    static readonly ALWAYS = new Validity(MIN_DATE, MAX_DATE);

    static until(validTo: Date): Validity {
        return new Validity(MIN_DATE, validTo);
    }

    static from(validFrom: Date): Validity {
        return new Validity(validFrom, MAX_DATE);
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
        if (validFrom.getTime() >= validTo.getTime()) {
            throw new Error(
                `validFrom must be before validTo: [${validFrom.toISOString()}, ${validTo.toISOString()})`
            );
        }
        return new Validity(validFrom, validTo);
    }

    static always(): Validity {
        return Validity.ALWAYS;
    }

    isValidAt(pointInTime: Date): boolean {
        return pointInTime.getTime() >= this.validFrom.getTime() &&
               pointInTime.getTime() < this.validTo.getTime();
    }

    hasExpired(pointInTime: Date): boolean {
        return pointInTime.getTime() >= this.validTo.getTime();
    }

    hasNotStartedYet(pointInTime: Date): boolean {
        return pointInTime.getTime() < this.validFrom.getTime();
    }

    overlaps(other: Validity): boolean {
        return this.validFrom.getTime() < other.validTo.getTime() &&
               other.validFrom.getTime() < this.validTo.getTime();
    }

    equals(other: Validity): boolean {
        return this.validFrom.getTime() === other.validFrom.getTime() &&
               this.validTo.getTime() === other.validTo.getTime();
    }
}
