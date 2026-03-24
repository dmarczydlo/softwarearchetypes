import { Money, Unit } from "@softwarearchetypes/quantity";

export interface PricingResult {
    money(): Money;
    describe(): string;
}

export class TotalPrice implements PricingResult {
    constructor(readonly amount: Money) {}

    money(): Money {
        return this.amount;
    }

    describe(): string {
        return `Total: ${this.amount}`;
    }
}

export class UnitPrice implements PricingResult {
    constructor(readonly amountPerUnit: Money, readonly unit: Unit) {}

    money(): Money {
        return this.amountPerUnit;
    }

    describe(): string {
        return `Unit price: ${this.amountPerUnit}/${this.unit}`;
    }
}

export class MarginalPrice implements PricingResult {
    constructor(readonly amount: Money, readonly unitIndex: number, readonly unit: Unit) {}

    money(): Money {
        return this.amount;
    }

    describe(): string {
        return `${this.unitIndex}-th ${this.unit.name}: ${this.amount}`;
    }
}
