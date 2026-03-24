import { describe, it, expect } from "vitest";
import { Money } from "@softwarearchetypes/quantity";
import { SimpleFixedCalculator, StepFunctionCalculator } from "./Calculator.js";
import { SimpleComponent, CompositeComponent } from "./Component.js";
import { SimpleComponentVersion } from "./SimpleComponentVersion.js";
import { CompositeComponentVersion } from "./CompositeComponentVersion.js";
import { Parameters } from "./Parameters.js";
import { Validity } from "./Validity.js";
import { VersionUpdateStrategy } from "./VersionUpdateStrategy.js";

function date(y: number, m: number, d: number, h = 0, min = 0): Date {
    return new Date(y, m - 1, d, h, min);
}

const CLOCK_NOW = date(2025, 1, 15, 12, 50);

describe("SimpleComponentVersioning", () => {
    it("should create component with initial version", () => {
        const calculator = new SimpleFixedCalculator("fixed-100", Money.pln(100));
        const validity = Validity.from(date(2024, 1, 1));
        const component = SimpleComponent.withInitialVersion("Base Price", calculator, validity, CLOCK_NOW);

        expect(component.name()).toBe("Base Price");
        expect(component.id()).not.toBeNull();
    });

    it("should calculate using version valid at given timestamp", () => {
        const calculator = new SimpleFixedCalculator("fixed-100", Money.pln(100));
        const validity = Validity.from(date(2024, 1, 1));
        const component = SimpleComponent.withInitialVersion("Base Price", calculator, validity, CLOCK_NOW);

        const params = Parameters.of("timestamp", date(2024, 1, 15));
        expect(component.calculate(params).equals(Money.pln(100))).toBe(true);
    });

    it("should add new version and keep old one", () => {
        const baseCalc = new SimpleFixedCalculator("fixed-100", Money.pln(100));
        const baseValidity = Validity.from(date(2024, 1, 1));
        let component = SimpleComponent.withInitialVersion("Base Price", baseCalc, baseValidity, CLOCK_NOW);

        const discountCalc = new SimpleFixedCalculator("fixed-80", Money.pln(80));
        const discountValidity = Validity.between(date(2024, 2, 1), date(2024, 3, 1));
        const discountVersion = new SimpleComponentVersion(discountCalc, {}, discountValidity, CLOCK_NOW);
        component = component.updateWith(discountVersion);

        expect(component.calculate(Parameters.of("timestamp", date(2024, 1, 15))).equals(Money.pln(100))).toBe(true);
        expect(component.calculate(Parameters.of("timestamp", date(2024, 2, 15))).equals(Money.pln(80))).toBe(true);
        expect(component.calculate(Parameters.of("timestamp", date(2024, 3, 15))).equals(Money.pln(100))).toBe(true);
    });

    it("should use youngest validFrom when versions overlap", () => {
        const baseCalc = new SimpleFixedCalculator("base", Money.pln(100));
        let component = SimpleComponent.withInitialVersion("Price", baseCalc, Validity.from(date(2024, 1, 1)), CLOCK_NOW);

        const calc1 = new SimpleFixedCalculator("v1", Money.pln(80));
        component = component.updateWith(new SimpleComponentVersion(calc1, {}, Validity.from(date(2024, 2, 1)), CLOCK_NOW));

        const calc2 = new SimpleFixedCalculator("v2", Money.pln(90));
        component = component.updateWith(new SimpleComponentVersion(calc2, {}, Validity.from(date(2024, 2, 10)), CLOCK_NOW));

        expect(component.calculate(Parameters.of("timestamp", date(2024, 2, 15))).equals(Money.pln(90))).toBe(true);
    });

    it("should throw when no version valid at timestamp", () => {
        const calculator = new SimpleFixedCalculator("fixed", Money.pln(100));
        const component = SimpleComponent.withInitialVersion("Price", calculator, Validity.from(date(2024, 2, 1)), CLOCK_NOW);

        expect(() => component.calculate(Parameters.of("timestamp", date(2024, 1, 15))))
            .toThrow("No version of component");
    });

    it("should reject version with identical validity by default", () => {
        const calc = new SimpleFixedCalculator("v1", Money.pln(100));
        const validity = Validity.from(date(2024, 1, 1));
        const component = SimpleComponent.withInitialVersion("Price", calc, validity, CLOCK_NOW);

        const calc2 = new SimpleFixedCalculator("v2", Money.pln(200));
        const duplicate = new SimpleComponentVersion(calc2, {}, validity, CLOCK_NOW);

        expect(() => component.updateWith(duplicate)).toThrow("identical validity period");
    });

    it("should allow version with identical validity using ALLOW_ALL", () => {
        const calc = new SimpleFixedCalculator("v1", Money.pln(100));
        const validity = Validity.from(date(2024, 1, 1));
        const component = SimpleComponent.withInitialVersion("Price", calc, validity, CLOCK_NOW);

        const calc2 = new SimpleFixedCalculator("v2", Money.pln(200));
        const now2 = new Date(CLOCK_NOW.getTime() + 600000);
        const duplicate = new SimpleComponentVersion(calc2, {}, validity, now2);
        const updated = component.updateWith(duplicate, VersionUpdateStrategy.ALLOW_ALL);

        expect(updated.calculate(Parameters.of("timestamp", date(2024, 1, 15))).equals(Money.pln(200))).toBe(true);
    });

    it("should reject overlapping versions using REJECT_OVERLAPPING", () => {
        const calc1 = new SimpleFixedCalculator("v1", Money.pln(100));
        const component = SimpleComponent.withInitialVersion("Price", calc1, Validity.from(date(2024, 1, 1)), CLOCK_NOW);

        const calc2 = new SimpleFixedCalculator("v2", Money.pln(80));
        const overlapping = new SimpleComponentVersion(calc2, {}, Validity.between(date(2024, 2, 1), date(2024, 3, 1)), CLOCK_NOW);

        expect(() => component.updateWith(overlapping, VersionUpdateStrategy.REJECT_OVERLAPPING)).toThrow("overlaps");
    });

    it("should work with parameter mappings", () => {
        const calculator = new StepFunctionCalculator("step", Money.pln(100), 10, 5);
        const mappings = { "kwh": "quantity" };
        const component = SimpleComponent.withInitialVersion("Energy Charge", calculator, mappings, Validity.from(date(2024, 1, 1)), CLOCK_NOW);

        const params = Parameters.of("timestamp", date(2024, 1, 15), "kwh", 15);
        const result = component.calculate(params);
        expect(result.equals(Money.pln(105))).toBe(true);
    });
});

describe("CompositeComponentVersioning", () => {
    it("should create composite with initial version", () => {
        const basePrice = SimpleComponent.withInitialVersion("Base Price", new SimpleFixedCalculator("base", Money.pln(100)), Validity.from(date(2024, 1, 1)), CLOCK_NOW);
        const tax = SimpleComponent.withInitialVersion("Tax", new SimpleFixedCalculator("tax", Money.pln(23)), Validity.from(date(2024, 1, 1)), CLOCK_NOW);

        const total = CompositeComponent.withInitialVersion("Total Price", [basePrice, tax], Validity.from(date(2024, 1, 1)), CLOCK_NOW);

        expect(total.name()).toBe("Total Price");
        const params = Parameters.of("timestamp", date(2024, 1, 15));
        expect(total.calculate(params).equals(Money.pln(123))).toBe(true);
    });

    it("should change composition over time", () => {
        const basePrice = SimpleComponent.withInitialVersion("Base Price", new SimpleFixedCalculator("base", Money.pln(100)), Validity.from(date(2024, 1, 1)), CLOCK_NOW);
        const tax = SimpleComponent.withInitialVersion("Tax", new SimpleFixedCalculator("tax", Money.pln(23)), Validity.from(date(2024, 1, 1)), CLOCK_NOW);

        let total = CompositeComponent.withInitialVersion("Total Price", [basePrice, tax], Validity.from(date(2024, 1, 1)), CLOCK_NOW);

        const surcharge = SimpleComponent.withInitialVersion("Seasonal Surcharge", new SimpleFixedCalculator("surcharge", Money.pln(10)), Validity.from(date(2024, 5, 1)), CLOCK_NOW);

        const newVersion = new CompositeComponentVersion(
            [basePrice, tax, surcharge], new Map(),
            Validity.from(date(2024, 5, 1)),
            new Date(CLOCK_NOW.getTime() + 600000)
        );
        total = total.updateWith(newVersion);

        expect(total.calculate(Parameters.of("timestamp", date(2024, 4, 15))).equals(Money.pln(123))).toBe(true);
        expect(total.calculate(Parameters.of("timestamp", date(2024, 5, 15))).equals(Money.pln(133))).toBe(true);
    });

    it("should work when children are also versioned", () => {
        const baseCalc = new SimpleFixedCalculator("base", Money.pln(100));
        let basePrice = SimpleComponent.withInitialVersion("Base Price", baseCalc, Validity.from(date(2024, 1, 1)), CLOCK_NOW);

        const discountCalc = new SimpleFixedCalculator("discount", Money.pln(80));
        const discountVersion = new SimpleComponentVersion(
            discountCalc, {},
            Validity.between(date(2024, 2, 1), date(2024, 3, 1)),
            new Date(CLOCK_NOW.getTime() + 600000)
        );
        basePrice = basePrice.updateWith(discountVersion);

        const tax = SimpleComponent.withInitialVersion("Tax", new SimpleFixedCalculator("tax", Money.pln(23)), Validity.from(date(2024, 1, 1)), CLOCK_NOW);
        const total = CompositeComponent.withInitialVersion("Total Price", [basePrice, tax], Validity.from(date(2024, 1, 1)), CLOCK_NOW);

        expect(total.calculate(Parameters.of("timestamp", date(2024, 1, 15))).equals(Money.pln(123))).toBe(true);
        expect(total.calculate(Parameters.of("timestamp", date(2024, 2, 15))).equals(Money.pln(103))).toBe(true);
        expect(total.calculate(Parameters.of("timestamp", date(2024, 3, 15))).equals(Money.pln(123))).toBe(true);
    });
});
