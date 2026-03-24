export interface SerialNumber {
    readonly type: string;
    readonly value: string;
}

export class TextualSerialNumber implements SerialNumber {
    readonly type: string = 'TEXTUAL';
    readonly value: string;

    constructor(value: string) {
        if (value == null) {
            throw new Error('SerialNumber value cannot be null');
        }
        if (value.trim().length === 0) {
            throw new Error('SerialNumber value cannot be blank');
        }
        this.value = value;
    }

    static of(value: string): TextualSerialNumber {
        return new TextualSerialNumber(value);
    }

    equals(other: SerialNumber): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}

export function serialNumberOf(value: string): SerialNumber {
    return new TextualSerialNumber(value);
}
