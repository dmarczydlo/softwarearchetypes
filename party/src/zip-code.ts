export class ZipCode {
    readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    static of(value: string): ZipCode {
        return new ZipCode(value);
    }

    asString(): string {
        return this.value;
    }
}
