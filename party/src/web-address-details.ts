import { AddressDetails } from './address-details.js';

const URL_PATTERN = /^(https?|ftp):\/\/[a-zA-Z0-9.-]+(:\d+)?(\/.*)?$/;

export class WebAddressDetails implements AddressDetails {
    readonly url: string;

    constructor(url: string) {
        if (url == null || url.trim().length === 0) {
            throw new Error('URL cannot be null or empty');
        }
        if (!URL_PATTERN.test(url)) {
            throw new Error('Invalid URL format: ' + url);
        }
        try {
            new URL(url);
        } catch {
            throw new Error('Invalid URL: ' + url);
        }
        this.url = url;
    }

    static of(url: string): WebAddressDetails {
        return new WebAddressDetails(url);
    }

    protocol(): string {
        return new URL(this.url).protocol.replace(':', '');
    }

    host(): string {
        return new URL(this.url).hostname;
    }
}
