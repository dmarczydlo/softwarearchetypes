const EPOCH = new Date(0);
const MAX_DATE = new Date(8640000000000000);

export class Validity {
    readonly validFrom: Date;
    readonly validTo: Date;

    constructor(validFrom: Date, validTo: Date) {
        this.validFrom = validFrom;
        this.validTo = validTo;
    }

    static readonly ALWAYS = new Validity(EPOCH, MAX_DATE);

    static until(validTo: Date): Validity {
        return new Validity(EPOCH, validTo);
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

    equals(other: Validity): boolean {
        return this.validFrom.getTime() === other.validFrom.getTime()
            && this.validTo.getTime() === other.validTo.getTime();
    }
}
