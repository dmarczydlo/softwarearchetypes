import { Preconditions } from "@softwarearchetypes/common";

function round5(value: number): number {
    return Math.round(value * 100000) / 100000;
}

export class Percentage {

    readonly value: number;

    constructor(value: number) {
        Preconditions.checkArgument(value >= 0, "Percentage value cannot be negative");
        this.value = round5(value);
    }

    static of(percentage: number): Percentage {
        return new Percentage(percentage);
    }

    static ofFraction(fraction: number): Percentage {
        return Percentage.of(fraction * 100);
    }

    static oneHundred(): Percentage {
        return Percentage.of(100);
    }

    static zero(): Percentage {
        return Percentage.of(0);
    }

    add(other: Percentage): Percentage {
        return new Percentage(round5(this.value + other.value));
    }

    subtract(other: Percentage): Percentage {
        return new Percentage(round5(this.value - other.value));
    }

    multiply(other: Percentage): Percentage {
        return new Percentage(round5(this.value * other.value / 100));
    }

    equals(other: Percentage): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return `${this.value}%`;
    }
}
