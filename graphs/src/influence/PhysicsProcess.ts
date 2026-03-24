export class PhysicsProcess {
    readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    equals(other: PhysicsProcess): boolean {
        return this.name === other.name;
    }

    toString(): string {
        return this.name;
    }
}
