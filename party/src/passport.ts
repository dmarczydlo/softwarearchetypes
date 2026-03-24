import { RegisteredIdentifier } from './registered-identifier.js';
import { Validity } from './validity.js';

const PATTERN = /^[A-Z]{2}\d{7}$/;
const TYPE = 'PASSPORT';

export class Passport implements RegisteredIdentifier {
    readonly number: string;
    private readonly _validity: Validity;

    constructor(number: string, validity: Validity) {
        if (number == null || !PATTERN.test(number)) {
            throw new Error('Passport number does not meet syntax criteria');
        }
        if (validity == null) {
            throw new Error('Passport must have validity period');
        }
        this.number = number;
        this._validity = validity;
    }

    static of(number: string, validity: Validity): Passport {
        return new Passport(number, validity);
    }

    type(): string { return TYPE; }
    asString(): string { return this.number; }
    validity(): Validity { return this._validity; }
    isCurrentlyValid(): boolean { return this._validity.isCurrentlyValid(); }
    isValidAt(instant: Date): boolean { return this._validity.isValidAt(instant); }
}
