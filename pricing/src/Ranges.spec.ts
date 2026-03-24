import { describe, it, expect } from "vitest";
import { Ranges } from "./Ranges.js";
import { CalculatorRange, TimeOfDay } from "./CalculatorRange.js";
import { CalculatorId } from "./CalculatorId.js";
import { Parameters } from "./Parameters.js";

describe("Ranges", () => {
    it("should create ranges with valid non-overlapping ranges", () => {
        const ranges = new Ranges("quantity", [
            CalculatorRange.numeric(0, 10, CalculatorId.generate()),
            CalculatorRange.numeric(10, 50, CalculatorId.generate()),
            CalculatorRange.numeric(50, 100, CalculatorId.generate()),
        ]);
        expect(ranges.size()).toBe(3);
    });

    it("should throw when ranges are empty", () => {
        expect(() => new Ranges("quantity", [])).toThrow();
    });

    it("should throw when range selector is null", () => {
        expect(() => new Ranges(null as any, [
            CalculatorRange.numeric(0, 10, CalculatorId.generate()),
        ])).toThrow();
    });

    it("should throw when ranges overlap", () => {
        expect(() => new Ranges("quantity", [
            CalculatorRange.numeric(0, 10, CalculatorId.generate()),
            CalculatorRange.numeric(5, 15, CalculatorId.generate()),
        ])).toThrow("overlap");
    });

    it("should throw when ranges have incompatible types", () => {
        expect(() => new Ranges("param", [
            CalculatorRange.numeric(0, 10, CalculatorId.generate()),
            CalculatorRange.time(TimeOfDay.of(8, 0), TimeOfDay.of(18, 0), CalculatorId.generate()),
        ])).toThrow("same type");
    });

    it("should find matching range for numeric value", () => {
        const matchingId = CalculatorId.generate();
        const ranges = new Ranges("quantity", [
            CalculatorRange.numeric(0, 10, CalculatorId.generate()),
            CalculatorRange.numeric(10, 50, matchingId),
            CalculatorRange.numeric(50, 100, CalculatorId.generate()),
        ]);

        const match = ranges.findMatching(new Parameters({ quantity: 25 }));
        expect(match).not.toBeNull();
        expect(match!.calculatorId().equals(matchingId)).toBe(true);
    });

    it("should return null when no matching range", () => {
        const ranges = new Ranges("quantity", [
            CalculatorRange.numeric(10, 50, CalculatorId.generate()),
        ]);
        const match = ranges.findMatching(new Parameters({ quantity: 5 }));
        expect(match).toBeNull();
    });

    it("should throw when parameter not found", () => {
        const ranges = new Ranges("quantity", [
            CalculatorRange.numeric(0, 10, CalculatorId.generate()),
        ]);
        expect(() => ranges.findMatching(new Parameters({ weight: 5 }))).toThrow("quantity");
    });
});
