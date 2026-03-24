export class Laboratory {
    readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    equals(other: Laboratory): boolean {
        return this.name === other.name;
    }

    toString(): string {
        return this.name;
    }
}
