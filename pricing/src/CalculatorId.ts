import { randomUUID } from "crypto";

export class CalculatorId {
    readonly id: string;

    constructor(id: string) {
        this.id = id;
    }

    static generate(): CalculatorId {
        return new CalculatorId(randomUUID());
    }

    toString(): string {
        return this.id;
    }

    equals(other: CalculatorId): boolean {
        return this.id === other.id;
    }
}
