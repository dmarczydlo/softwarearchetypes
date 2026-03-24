import { RegisteredIdentifier } from './registered-identifier.js';
import { Validity } from './validity.js';

const PATTERN = /^\d{11}$/;
const TYPE = 'PERSONAL_IDENTIFICATION_NUMBER';
const CHECKSUM_WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];

function isValidChecksum(value: string): boolean {
    if (value.length !== 11) return false;
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(value.charAt(i)) * CHECKSUM_WEIGHTS[i];
    }
    const checksum = (10 - (sum % 10)) % 10;
    return checksum === parseInt(value.charAt(10));
}

export class PersonalIdentificationNumber implements RegisteredIdentifier {
    readonly value: string;

    constructor(value: string) {
        if (value == null || !PATTERN.test(value)) {
            throw new Error('Personal identification number does not meet syntax criteria');
        }
        if (!isValidChecksum(value)) {
            throw new Error('Personal identification number has invalid checksum');
        }
        this.value = value;
    }

    static of(value: string): PersonalIdentificationNumber {
        return new PersonalIdentificationNumber(value);
    }

    type(): string { return TYPE; }
    asString(): string { return this.value; }
    validity(): Validity { return Validity.ALWAYS; }
    isCurrentlyValid(): boolean { return this.validity().isCurrentlyValid(); }
    isValidAt(instant: Date): boolean { return this.validity().isValidAt(instant); }
}
