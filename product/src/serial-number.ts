import { Preconditions } from "@softwarearchetypes/common";

export interface SerialNumber {
    type(): string;
    value: string;
}

export class TextualSerialNumber implements SerialNumber {
    readonly value: string;

    constructor(value: string) {
        Preconditions.checkArgument(value != null && value.trim().length > 0,
            "SerialNumber cannot be null or blank");
        this.value = value;
    }

    static of(value: string): TextualSerialNumber {
        return new TextualSerialNumber(value);
    }

    type(): string {
        return "TEXTUAL";
    }

    toString(): string {
        return this.value;
    }
}

export class VinSerialNumber implements SerialNumber {
    readonly value: string;

    constructor(value: string) {
        Preconditions.checkArgument(value != null && value.trim().length > 0, "VIN cannot be null or blank");
        const normalized = value.toUpperCase().replace(/[\s-]/g, "");
        Preconditions.checkArgument(normalized.length === 17, "VIN must be exactly 17 characters");
        Preconditions.checkArgument(/^[A-HJ-NPR-Z0-9]{17}$/.test(normalized),
            "VIN must contain only uppercase letters and digits (excluding I, O, Q)");
        this.value = value;
    }

    static of(value: string): VinSerialNumber {
        return new VinSerialNumber(value);
    }

    type(): string {
        return "VIN";
    }

    toString(): string {
        return this.value;
    }
}

export class ImeiSerialNumber implements SerialNumber {
    readonly value: string;

    constructor(value: string) {
        Preconditions.checkArgument(value != null && value.trim().length > 0, "IMEI cannot be null or blank");
        const normalized = value.replace(/[\s-]/g, "");
        Preconditions.checkArgument(/^\d{15}$/.test(normalized), "IMEI must be exactly 15 digits");
        Preconditions.checkArgument(ImeiSerialNumber.isValidLuhnChecksum(normalized),
            "Invalid IMEI check digit (Luhn algorithm)");
        this.value = value;
    }

    static of(value: string): ImeiSerialNumber {
        return new ImeiSerialNumber(value);
    }

    type(): string {
        return "IMEI";
    }

    toString(): string {
        return this.value;
    }

    private static isValidLuhnChecksum(imei: string): boolean {
        let sum = 0;
        let alternate = false;
        for (let i = imei.length - 1; i >= 0; i--) {
            let digit = parseInt(imei.charAt(i), 10);
            if (alternate) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
            alternate = !alternate;
        }
        return sum % 10 === 0;
    }
}

export const SerialNumberFactory = {
    of(value: string): SerialNumber {
        return TextualSerialNumber.of(value);
    },
    vin(value: string): SerialNumber {
        return VinSerialNumber.of(value);
    },
    imei(value: string): SerialNumber {
        return ImeiSerialNumber.of(value);
    }
};
