import { Preconditions } from "@softwarearchetypes/common";

export class Unit {

    readonly symbol: string;
    readonly name: string;

    constructor(symbol: string, name: string) {
        Preconditions.checkArgument(symbol != null && symbol.trim().length > 0, "Unit symbol cannot be null or blank");
        Preconditions.checkArgument(name != null && name.trim().length > 0, "Unit name cannot be null or blank");
        this.symbol = symbol;
        this.name = name;
    }

    static of(symbol: string, name: string): Unit {
        return new Unit(symbol, name);
    }

    static pieces(): Unit {
        return new Unit("pcs", "pieces");
    }

    static kilograms(): Unit {
        return new Unit("kg", "kilograms");
    }

    static liters(): Unit {
        return new Unit("l", "liters");
    }

    static meters(): Unit {
        return new Unit("m", "meters");
    }

    static squareMeters(): Unit {
        return new Unit("m\u00B2", "square meters");
    }

    static cubicMeters(): Unit {
        return new Unit("m\u00B3", "cubic meters");
    }

    static hours(): Unit {
        return new Unit("h", "hours");
    }

    static minutes(): Unit {
        return new Unit("min", "minutes");
    }

    static packages(): Unit {
        return new Unit("pkg", "packages");
    }

    static accounts(): Unit {
        return new Unit("acc", "accounts");
    }

    toString(): string {
        return this.symbol;
    }

    equals(other: Unit): boolean {
        return this.symbol === other.symbol && this.name === other.name;
    }
}
