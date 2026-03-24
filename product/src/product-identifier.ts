import { Preconditions } from "@softwarearchetypes/common";
import { randomUUID } from "crypto";

export interface ProductIdentifier {
    type(): string;
    toString(): string;
}

export class UuidProductIdentifier implements ProductIdentifier {
    readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    static random(): UuidProductIdentifier {
        return new UuidProductIdentifier(randomUUID());
    }

    static of(value: string): UuidProductIdentifier {
        return new UuidProductIdentifier(value);
    }

    type(): string {
        return "UUID";
    }

    toString(): string {
        return this.value;
    }

    equals(other: ProductIdentifier): boolean {
        return other instanceof UuidProductIdentifier && this.value === other.value;
    }
}

export class GtinProductIdentifier implements ProductIdentifier {
    readonly value: string;

    constructor(value: string) {
        Preconditions.checkArgument(value != null && value.trim().length > 0, "GTIN cannot be null or blank");
        const normalized = value.replace(/[-\s]/g, "");
        Preconditions.checkArgument(/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(normalized),
            "GTIN must be 8, 12, 13, or 14 digits");
        Preconditions.checkArgument(GtinProductIdentifier.isValidCheckDigit(normalized), "Invalid GTIN check digit");
        this.value = value;
    }

    static of(value: string): GtinProductIdentifier {
        return new GtinProductIdentifier(value);
    }

    type(): string {
        return "GTIN-" + this.value.length;
    }

    toString(): string {
        return this.value;
    }

    equals(other: ProductIdentifier): boolean {
        return other instanceof GtinProductIdentifier && this.value === other.value;
    }

    private static isValidCheckDigit(gtin: string): boolean {
        let sum = 0;
        for (let i = 0; i < gtin.length - 1; i++) {
            const digit = parseInt(gtin.charAt(i), 10);
            const multiplier = ((gtin.length - i) % 2 === 0) ? 3 : 1;
            sum += digit * multiplier;
        }
        const checkDigit = parseInt(gtin.charAt(gtin.length - 1), 10);
        const calculatedCheck = (10 - (sum % 10)) % 10;
        return checkDigit === calculatedCheck;
    }
}

export class IsbnProductIdentifier implements ProductIdentifier {
    readonly value: string;

    constructor(value: string) {
        Preconditions.checkArgument(value != null && value.trim().length > 0, "ISBN cannot be null or blank");
        const normalized = value.replace(/[-\s]/g, "");
        Preconditions.checkArgument(/^\d{9}[\dX]$/.test(normalized),
            "ISBN must be 10 digits with optional check digit X");
        Preconditions.checkArgument(IsbnProductIdentifier.isValidCheckDigit(normalized), "Invalid ISBN check digit");
        this.value = value;
    }

    static of(value: string): IsbnProductIdentifier {
        return new IsbnProductIdentifier(value);
    }

    type(): string {
        return "ISBN";
    }

    toString(): string {
        return "ISBN " + this.value;
    }

    equals(other: ProductIdentifier): boolean {
        return other instanceof IsbnProductIdentifier && this.value === other.value;
    }

    private static isValidCheckDigit(isbn: string): boolean {
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += (10 - i) * parseInt(isbn.charAt(i), 10);
        }
        const checkChar = isbn.charAt(9);
        const checkDigit = (checkChar === 'X') ? 10 : parseInt(checkChar, 10);
        return (sum + checkDigit) % 11 === 0;
    }
}
