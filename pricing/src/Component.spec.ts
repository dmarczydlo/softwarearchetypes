import { describe, it, expect } from "vitest";
import { Money } from "@softwarearchetypes/quantity";
import {
    SimpleFixedCalculator,
    StepFunctionCalculator,
    PercentageCalculator,
} from "./Calculator.js";
import { SimpleComponent, CompositeComponent } from "./Component.js";
import { Interpretation } from "./Interpretation.js";
import { Parameters } from "./Parameters.js";
import { ValueOf, SumOf, DifferenceOf, ProductOf } from "./ParameterValue.js";

describe("Component", () => {
    it("simple component should calculate using wrapped calculator", () => {
        const calculator = new SimpleFixedCalculator("fixed-20", Money.pln(20));
        const component = SimpleComponent.of("base-fee", calculator);
        const result = component.calculate(Parameters.empty());
        expect(result.equals(Money.pln(20))).toBe(true);
        expect(component.interpretation()).toBe(Interpretation.TOTAL);
    });

    it("composite component should sum children results", () => {
        const fee1 = SimpleComponent.of("fee-1", new SimpleFixedCalculator("calc-1", Money.pln(10)));
        const fee2 = SimpleComponent.of("fee-2", new SimpleFixedCalculator("calc-2", Money.pln(30)));
        const composite = CompositeComponent.of("total-fees", fee1, fee2);
        const result = composite.calculate(Parameters.empty());
        expect(result.equals(Money.pln(40))).toBe(true);
    });

    it("composite should provide hierarchical breakdown", () => {
        const fee1 = SimpleComponent.of("maintenance", new SimpleFixedCalculator("calc-1", Money.pln(25)));
        const fee2 = SimpleComponent.of("commission", new SimpleFixedCalculator("calc-2", Money.pln(20)));
        const baseFee = CompositeComponent.of("base-fee", fee1, fee2);
        const extra = SimpleComponent.of("extra-charge", new SimpleFixedCalculator("calc-3", Money.pln(5)));
        const total = CompositeComponent.of("total", baseFee, extra);

        const breakdown = total.calculateBreakdown(Parameters.empty());
        expect(breakdown.total().equals(Money.pln(50))).toBe(true);
        expect(breakdown.children.length).toBe(2);

        const baseFeeBreakdown = breakdown.children.find(c => c.name === "base-fee")!;
        expect(baseFeeBreakdown.total().equals(Money.pln(45))).toBe(true);
        expect(baseFeeBreakdown.children.length).toBe(2);
    });

    it("composite should enrich parameters based on dependencies", () => {
        const base = SimpleComponent.of("base-price", new SimpleFixedCalculator("base", Money.pln(100)));
        const vat = SimpleComponent.of("vat", new PercentageCalculator("vat", 23));

        const deps = new Map<string, Map<string, any>>([
            ["vat", new Map([["baseAmount", new ValueOf("base-price")]])],
        ]);
        const total = CompositeComponent.of("total-with-vat", deps, base, vat);
        const result = total.calculate(Parameters.empty());
        expect(result.equals(Money.pln(123))).toBe(true);
    });

    it("composite should support SumOf dependency", () => {
        const fee1 = SimpleComponent.of("fee-1", new SimpleFixedCalculator("c1", Money.pln(50)));
        const fee2 = SimpleComponent.of("fee-2", new SimpleFixedCalculator("c2", Money.pln(30)));
        const tax = SimpleComponent.of("tax", new PercentageCalculator("tax-calc", 10));

        const deps = new Map<string, Map<string, any>>([
            ["tax", new Map([["baseAmount", new SumOf("fee-1", "fee-2")]])],
        ]);
        const total = CompositeComponent.of("total-with-tax", deps, fee1, fee2, tax);
        const result = total.calculate(Parameters.empty());
        // fee1=50, fee2=30, sum=80, tax=8, total=88
        expect(result.equals(Money.pln(88))).toBe(true);
    });

    it("composite should support DifferenceOf dependency", () => {
        const revenue = SimpleComponent.of("revenue", new SimpleFixedCalculator("rev", Money.pln(1000)));
        const costs = SimpleComponent.of("costs", new SimpleFixedCalculator("cost", Money.pln(400)));
        const profitTax = SimpleComponent.of("profit-tax", new PercentageCalculator("tax", 19));

        const deps = new Map<string, Map<string, any>>([
            ["profit-tax", new Map([["baseAmount", new DifferenceOf("revenue", "costs")]])],
        ]);
        const financials = CompositeComponent.of("financials", deps, revenue, costs, profitTax);
        const result = financials.calculate(Parameters.empty());
        // revenue=1000, costs=400, profit=600, tax=114, total=1514
        expect(result.equals(Money.pln(1514))).toBe(true);
    });

    it("composite should support ProductOf dependency", () => {
        const base = SimpleComponent.of("base", new SimpleFixedCalculator("base", Money.pln(100)));
        const enhanced = SimpleComponent.of("enhanced", new PercentageCalculator("calc", 10));

        const deps = new Map<string, Map<string, any>>([
            ["enhanced", new Map([["baseAmount", new ProductOf("base", 1.5)]])],
        ]);
        const total = CompositeComponent.of("total", deps, base, enhanced);
        const result = total.calculate(Parameters.empty());
        // base=100, enhanced base=150, enhanced=15, total=115
        expect(result.equals(Money.pln(115))).toBe(true);
    });

    it("composite should handle mixed interpretations", () => {
        const totalComp = SimpleComponent.of("total-comp", new SimpleFixedCalculator("total", Money.pln(100)));
        const unitComp = SimpleComponent.of("unit-comp", new SimpleFixedCalculator("unit", Money.pln(10), Interpretation.UNIT));

        const composite = CompositeComponent.of("mixed", totalComp, unitComp);
        expect(composite.interpretation()).toBe(Interpretation.TOTAL);

        // totalComponent = 100, unitComponent = 10 * 5 = 50, sum = 150
        const result = composite.calculate(Parameters.of("quantity", 5));
        expect(result.equals(Money.pln(150))).toBe(true);
    });

    it("composite should throw when dependent component not calculated yet", () => {
        const comp1 = SimpleComponent.of("comp-1", new SimpleFixedCalculator("c1", Money.pln(100)));
        const comp2 = SimpleComponent.of("comp-2", new PercentageCalculator("c2", 10));

        const deps = new Map<string, Map<string, any>>([
            ["comp-2", new Map([["baseAmount", new ValueOf("comp-1")]])],
        ]);
        // Wrong order: comp-2 before comp-1
        const composite = CompositeComponent.of("invalid-order", deps, [comp2, comp1]);

        expect(() => composite.calculate(Parameters.empty()))
            .toThrow("Component 'comp-1' has not been calculated yet. Check execution order.");
    });

    it("composite should throw when referenced component not found", () => {
        const comp = SimpleComponent.of("comp", new PercentageCalculator("c", 10));
        const deps = new Map<string, Map<string, any>>([
            ["comp", new Map([["baseAmount", new ValueOf("non-existent")]])],
        ]);
        const composite = CompositeComponent.of("invalid-ref", deps, comp);

        expect(() => composite.calculate(Parameters.empty()))
            .toThrow("Component 'non-existent' not found");
    });

    it("simple component should map parameters", () => {
        const calculator = new StepFunctionCalculator("calc", Money.pln(0), 1, 3);
        const component = SimpleComponent.of("mapped", calculator, { "my_quantity": "quantity" });
        const result = component.calculate(Parameters.of("my_quantity", 5));
        // 5 * 3 = 15
        expect(result.equals(Money.pln(15))).toBe(true);
    });

    it("simple component should convert to target interpretation using adapters", () => {
        const unitPriceCalc = new SimpleFixedCalculator("unit", Money.pln(10), Interpretation.UNIT);
        const component = SimpleComponent.of("unit-comp", unitPriceCalc);

        // As TOTAL: 10 * 5 = 50
        const resultAsTotal = component.calculate(Parameters.of("quantity", 5), Interpretation.TOTAL);
        expect(resultAsTotal.equals(Money.pln(50))).toBe(true);

        // As UNIT: 10
        const resultAsUnit = component.calculate(Parameters.of("quantity", 5), Interpretation.UNIT);
        expect(resultAsUnit.equals(Money.pln(10))).toBe(true);
    });

    it("composite should throw when empty", () => {
        const empty = CompositeComponent.of("empty", []);
        expect(() => empty.calculate(Parameters.empty())).toThrow("Composite component empty has no children");
    });

    it("composite should pass parameters to all children", () => {
        const comp1 = SimpleComponent.of("comp1", new StepFunctionCalculator("step1", Money.pln(0), 1, 2));
        const comp2 = SimpleComponent.of("comp2", new StepFunctionCalculator("step2", Money.pln(0), 1, 3));
        const composite = CompositeComponent.of("total", comp1, comp2);
        const result = composite.calculate(Parameters.of("quantity", 5));
        // comp1: 5*2=10, comp2: 5*3=15, total=25
        expect(result.equals(Money.pln(25))).toBe(true);
    });
});
