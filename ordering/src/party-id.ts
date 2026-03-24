export class PartyId {
    readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    static of(value: string): PartyId {
        return new PartyId(value);
    }

    equals(other: PartyId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
