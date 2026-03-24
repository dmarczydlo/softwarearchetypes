export class Version {
    public readonly value: number;

    private static readonly INITIAL_VALUE: number = 0;

    constructor(value: number) {
        this.value = value;
    }

    public static initial(): Version {
        return new Version(Version.INITIAL_VALUE);
    }

    public static of(value: number): Version {
        return new Version(value);
    }

    public equals(other: Version): boolean {
        return this.value === other.value;
    }

    public hashCode(): number {
        return this.value;
    }

    public toString(): string {
        return `Version[value=${this.value}]`;
    }
}
