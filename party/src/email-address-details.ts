import { AddressDetails } from './address-details.js';

const EMAIL_PATTERN = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/;

export class EmailAddressDetails implements AddressDetails {
    readonly email: string;

    constructor(email: string) {
        if (email == null || email.trim().length === 0) {
            throw new Error('Email address cannot be null or empty');
        }
        if (!EMAIL_PATTERN.test(email)) {
            throw new Error('Invalid email address format: ' + email);
        }
        this.email = email;
    }

    static of(email: string): EmailAddressDetails {
        return new EmailAddressDetails(email);
    }
}
