import { RegisteredIdentifier } from './registered-identifier.js';
import { Validity } from './validity.js';

const PATTERN = /^\d{10}$/;
const TYPE = 'TAX_NUMBER';
const CHECKSUM_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7];

function isValidChecksum(value: string): boolean {
    if (value.length !== 10) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(value.charAt(i)) * CHECKSUM_WEIGHTS[i];
    }
    const checksum = sum % 11;
    if (checksum === 10) return false;
    return checksum === parseInt(value.charAt(9));
}

export class TaxNumber implements RegisteredIdentifier {
    readonly value: string;

    constructor(value: string) {
        if (value == null || !PATTERN.test(value)) {
            throw new Error('Tax number does not meet syntax criteria');
        }
        if (!isValidChecksum(value)) {
            throw new Error('Tax number has invalid checksum');
        }
        this.value = value;
    }

    static of(value: string): TaxNumber {
        return new TaxNumber(value);
    }

    type(): string { return TYPE; }
    asString(): string { return this.value; }
    validity(): Validity { return Validity.ALWAYS; }
    isCurrentlyValid(): boolean { return this.validity().isCurrentlyValid(); }
    isValidAt(instant: Date): boolean { return this.validity().isValidAt(instant); }
}
