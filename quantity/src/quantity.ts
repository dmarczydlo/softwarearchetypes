import { Preconditions } from "@softwarearchetypes/common";
import { Unit } from "./unit";

export class Quantity {

    readonly amount: number;
    readonly unit: Unit;

    constructor(amount: number, unit: Unit) {
        Preconditions.checkArgument(amount != null, "Amount cannot be null");
        Preconditions.checkArgument(unit != null, "Unit cannot be null");
        Preconditions.checkArgument(amount >= 0, "Amount cannot be negative");
        this.amount = amount;
        this.unit = unit;
    }

    static of(amount: number, unit: Unit): Quantity {
        return new Quantity(amount, unit);
    }

    add(other: Quantity): Quantity {
        Preconditions.checkArgument(
            this.unit.equals(other.unit),
            `Cannot add quantities with different units: ${this.unit.toString()} and ${other.unit.toString()}`
        );
        return new Quantity(this.amount + other.amount, this.unit);
    }

    subtract(other: Quantity): Quantity {
        Preconditions.checkArgument(
            this.unit.equals(other.unit),
            `Cannot subtract quantities with different units: ${this.unit.toString()} and ${other.unit.toString()}`
        );
        return new Quantity(this.amount - other.amount, this.unit);
    }

    compareTo(other: Quantity): number {
        Preconditions.checkArgument(
            this.unit.equals(other.unit),
            `Cannot compare quantities with different units: ${this.unit.toString()} and ${other.unit.toString()}`
        );
        if (this.amount < other.amount) return -1;
        if (this.amount > other.amount) return 1;
        return 0;
    }

    equals(other: Quantity): boolean {
        return this.amount === other.amount && this.unit.equals(other.unit);
    }

    toString(): string {
        return `${this.amount} ${this.unit.toString()}`;
    }
}
