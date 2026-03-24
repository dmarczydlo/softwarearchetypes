import { describe, it, expect, beforeEach } from "vitest";
import { Money } from "@softwarearchetypes/quantity";
import {
    SimpleFixedCalculator,
    StepFunctionCalculator,
    DiscretePointsCalculator,
    DailyIncrementCalculator,
    ContinuousLinearTimeCalculator,
    PercentageCalculator,
    UnitToTotalAdapter,
    UnitToMarginalAdapter,
    TotalToUnitAdapter,
    TotalToMarginalAdapter,
    MarginalToTotalAdapter,
    MarginalToUnitAdapter,
} from "./Calculator.js";
import { CalculatorType } from "./CalculatorType.js";
import { Interpretation } from "./Interpretation.js";
import { Parameters } from "./Parameters.js";
import { StepBoundary } from "./StepBoundary.js";

function date(y: number, m: number, d: number, h = 0, min = 0, s = 0): Date {
    return new Date(y, m - 1, d, h, min, s);
}

describe("StepFunctionCalculator", () => {
    it("should calculate base price for quantity within first step", () => {
        const calc = new StepFunctionCalculator("Volume Pricing", Money.pln(100), 10, 5);
        const result = calc.calculate(Parameters.of("quantity", 5));
        expect(result.value()).toBe(100);
    });

    it("should calculate increased price for second step", () => {
        const calc = new StepFunctionCalculator("Volume Pricing", Money.pln(100), 10, 5);
        const result = calc.calculate(Parameters.of("quantity", 15));
        expect(result.value()).toBe(105);
    });

    it("should calculate increased price for multiple steps", () => {
        const calc = new StepFunctionCalculator("Volume Pricing", Money.pln(100), 10, 5);
        const result = calc.calculate(Parameters.of("quantity", 35));
        expect(result.value()).toBe(115);
    });

    it("should calculate price at exact step boundary", () => {
        const calc = new StepFunctionCalculator("Volume Pricing", Money.pln(100), 10, 5);
        const result = calc.calculate(Parameters.of("quantity", 20));
        expect(result.value()).toBe(110);
    });

    it("should throw when quantity parameter missing", () => {
        const calc = new StepFunctionCalculator("Volume Pricing", Money.pln(100), 10, 5);
        expect(() => calc.calculate(Parameters.empty())).toThrow();
    });

    it("should return correct type", () => {
        const calc = new StepFunctionCalculator("Volume Pricing", Money.pln(100), 10, 5);
        expect(calc.getType()).toBe(CalculatorType.STEP_FUNCTION);
    });
});

describe("DiscretePointsCalculator", () => {
    it("should return price for defined quantity", () => {
        const points = new Map<number, Money>([
            [5, Money.pln(100)],
            [10, Money.pln(180)],
            [20, Money.pln(350)],
        ]);
        const calc = new DiscretePointsCalculator("Volume Discount", points);
        expect(calc.calculate(Parameters.of("quantity", 10)).value()).toBe(180);
    });

    it("should throw for undefined quantity", () => {
        const points = new Map<number, Money>([[5, Money.pln(100)]]);
        const calc = new DiscretePointsCalculator("Volume Discount", points);
        expect(() => calc.calculate(Parameters.of("quantity", 7))).toThrow("not defined");
    });
});

describe("DailyIncrementCalculator", () => {
    it("should calculate price at start date", () => {
        const calc = new DailyIncrementCalculator("presale", date(2024, 6, 1), Money.pln(1999), Money.pln(100));
        const result = calc.calculate(Parameters.of("date", date(2024, 6, 1)));
        expect(result.value()).toBe(1999);
    });

    it("should calculate price after seven days", () => {
        const calc = new DailyIncrementCalculator("presale", date(2024, 6, 1), Money.pln(1999), Money.pln(100));
        const result = calc.calculate(Parameters.of("date", date(2024, 6, 8)));
        expect(result.value()).toBe(2699);
    });

    it("should calculate price after fourteen days", () => {
        const calc = new DailyIncrementCalculator("presale", date(2024, 6, 1), Money.pln(1999), Money.pln(100));
        const result = calc.calculate(Parameters.of("date", date(2024, 6, 15)));
        expect(result.value()).toBe(3399);
    });
});

describe("ContinuousLinearTimeCalculator", () => {
    it("should return start price at start time", () => {
        const startTime = date(2024, 6, 1);
        const endTime = date(2024, 6, 15);
        const calc = new ContinuousLinearTimeCalculator("auction", startTime, Money.pln(1999), endTime, Money.pln(3399));
        const result = calc.calculate(Parameters.of("time", startTime));
        expect(result.value()).toBe(1999);
    });

    it("should return end price at end time", () => {
        const startTime = date(2024, 6, 1);
        const endTime = date(2024, 6, 15);
        const calc = new ContinuousLinearTimeCalculator("auction", startTime, Money.pln(1999), endTime, Money.pln(3399));
        const result = calc.calculate(Parameters.of("time", endTime));
        expect(result.value()).toBe(3399);
    });

    it("should interpolate at midpoint", () => {
        const startTime = date(2024, 6, 1);
        const endTime = date(2024, 6, 15);
        const calc = new ContinuousLinearTimeCalculator("auction", startTime, Money.pln(1999), endTime, Money.pln(3399));
        const midTime = date(2024, 6, 8);
        const result = calc.calculate(Parameters.of("time", midTime));
        expect(result.value()).toBe(2699);
    });

    it("should throw for time before start", () => {
        const startTime = date(2024, 6, 1);
        const endTime = date(2024, 6, 15);
        const calc = new ContinuousLinearTimeCalculator("auction", startTime, Money.pln(1999), endTime, Money.pln(3399));
        expect(() => calc.calculate(Parameters.of("time", date(2024, 5, 31, 12)))).toThrow();
    });
});

describe("Adapters", () => {
    it("unitToTotalAdapter should multiply by quantity", () => {
        const unitCalc = new SimpleFixedCalculator("unit-price", Money.pln(10), Interpretation.UNIT);
        const totalCalc = UnitToTotalAdapter.wrap("adapter", unitCalc);
        const total = totalCalc.calculate(Parameters.of("quantity", 15));
        expect(total.equals(Money.pln(150))).toBe(true);
        expect(totalCalc.interpretation()).toBe(Interpretation.TOTAL);
    });

    it("unitToTotalAdapter should reject non-unit calculator", () => {
        const totalCalc = new SimpleFixedCalculator("total", Money.pln(100), Interpretation.TOTAL);
        expect(() => UnitToTotalAdapter.wrap("adapter", totalCalc)).toThrow("UNIT");
    });

    it("totalToUnitAdapter should divide by quantity", () => {
        const totalCalc = new StepFunctionCalculator("bulk", Money.pln(100), 10, 5, Interpretation.TOTAL);
        const unitCalc = TotalToUnitAdapter.wrap("adapter", totalCalc);
        const unit = unitCalc.calculate(Parameters.of("quantity", 15));
        expect(unit.equals(Money.pln(7))).toBe(true);
    });

    it("totalToMarginalAdapter should calculate derivative", () => {
        const totalCalc = new StepFunctionCalculator("step", Money.pln(100), 10, 5, Interpretation.TOTAL);
        const marginalCalc = TotalToMarginalAdapter.wrap("adapter", totalCalc);

        const marginal1 = marginalCalc.calculate(Parameters.of("quantity", 1));
        expect(marginal1.equals(Money.pln(100))).toBe(true);

        const marginal10 = marginalCalc.calculate(Parameters.of("quantity", 10));
        expect(marginal10.equals(Money.pln(5))).toBe(true);

        const marginal11 = marginalCalc.calculate(Parameters.of("quantity", 11));
        expect(marginal11.equals(Money.pln(0))).toBe(true);
    });

    it("marginalToTotalAdapter should sum marginal prices", () => {
        const marginalCalc = new SimpleFixedCalculator("marginal", Money.pln(10), Interpretation.MARGINAL);
        const totalCalc = MarginalToTotalAdapter.wrap("adapter", marginalCalc);
        const total = totalCalc.calculate(Parameters.of("quantity", 5));
        expect(total.equals(Money.pln(50))).toBe(true);
    });

    it("adapters should have correct types", () => {
        const unitCalc = new SimpleFixedCalculator("u", Money.pln(10), Interpretation.UNIT);
        const totalCalc = new SimpleFixedCalculator("t", Money.pln(100), Interpretation.TOTAL);
        const marginalCalc = new SimpleFixedCalculator("m", Money.pln(10), Interpretation.MARGINAL);

        expect(UnitToTotalAdapter.wrap("a", unitCalc).getType()).toBe(CalculatorType.UNIT_TO_TOTAL_ADAPTER);
        expect(UnitToMarginalAdapter.wrap("a", unitCalc).getType()).toBe(CalculatorType.UNIT_TO_MARGINAL_ADAPTER);
        expect(TotalToUnitAdapter.wrap("a", totalCalc).getType()).toBe(CalculatorType.TOTAL_TO_UNIT_ADAPTER);
        expect(TotalToMarginalAdapter.wrap("a", totalCalc).getType()).toBe(CalculatorType.TOTAL_TO_MARGINAL_ADAPTER);
        expect(MarginalToTotalAdapter.wrap("a", marginalCalc).getType()).toBe(CalculatorType.MARGINAL_TO_TOTAL_ADAPTER);
        expect(MarginalToUnitAdapter.wrap("a", marginalCalc).getType()).toBe(CalculatorType.MARGINAL_TO_UNIT_ADAPTER);
    });
});

describe("Interpretation", () => {
    it("should have TOTAL as default for SimpleFixed", () => {
        expect(new SimpleFixedCalculator("test", Money.pln(100)).interpretation()).toBe(Interpretation.TOTAL);
    });

    it("should allow setting interpretation for SimpleFixed", () => {
        expect(new SimpleFixedCalculator("test", Money.pln(100), Interpretation.UNIT).interpretation()).toBe(Interpretation.UNIT);
    });

    it("should have TOTAL as default for StepFunction", () => {
        expect(new StepFunctionCalculator("test", Money.pln(100), 10, 5).interpretation()).toBe(Interpretation.TOTAL);
    });

    it("should allow setting interpretation for StepFunction", () => {
        expect(new StepFunctionCalculator("test", Money.pln(100), 10, 5, Interpretation.MARGINAL).interpretation()).toBe(Interpretation.MARGINAL);
    });
});

describe("PercentageCalculator", () => {
    it("should calculate percentage of base amount", () => {
        const calc = new PercentageCalculator("vat", 23);
        const result = calc.calculate(Parameters.of("baseAmount", Money.pln(100)));
        expect(result.equals(Money.pln(23))).toBe(true);
    });
});
