import { AddressDetails } from './address-details.js';

const PL = /^\+48\d{9}$/;
const US = /^\+1\d{10}$/;
const UK = /^\+44\d{7,10}$/;
const FR = /^\+33\d{9}$/;
const DE = /^\+49\d{5,12}$/;
const LOCAL = /^\d{7,10}$/;
const PATTERNS = [PL, US, UK, FR, DE, LOCAL];
const MIN_DIGITS = 7;
const MAX_DIGITS = 15;

export class PhoneAddressDetails implements AddressDetails {
    readonly phoneNumber: string;

    constructor(phoneNumber: string) {
        if (phoneNumber == null || phoneNumber.trim().length === 0) {
            throw new Error('Phone number cannot be null or empty');
        }
        const stripped = phoneNumber.replace(/[\s.()-]/g, '');
        if (!/^\+?\d+$/.test(stripped)) {
            throw new Error('Invalid phone number format: ' + phoneNumber);
        }
        const digitsOnly = stripped.replace(/[^0-9]/g, '');
        if (digitsOnly.length < MIN_DIGITS || digitsOnly.length > MAX_DIGITS) {
            throw new Error(`Phone number must contain between ${MIN_DIGITS} and ${MAX_DIGITS} digits: ${phoneNumber}`);
        }
        if (!PATTERNS.some(pattern => pattern.test(stripped))) {
            throw new Error('Invalid phone number format: ' + phoneNumber);
        }
        this.phoneNumber = phoneNumber;
    }

    static of(phoneNumber: string): PhoneAddressDetails {
        return new PhoneAddressDetails(phoneNumber);
    }

    normalized(): string {
        let result = this.phoneNumber.replace(/[\s.()-]/g, '');
        if (this.phoneNumber.startsWith('+') && !result.startsWith('+')) {
            result = '+' + result;
        }
        return result;
    }
}
