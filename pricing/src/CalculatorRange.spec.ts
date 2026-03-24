import { describe, it, expect } from "vitest";
import { CalculatorRange, NumericRange, DateRange, TimeRange, TimeOfDay } from "./CalculatorRange.js";
import { CalculatorId } from "./CalculatorId.js";

function date(y: number, m: number, d: number): Date {
    return new Date(y, m - 1, d);
}

describe("NumericRange", () => {
    it("should contain value in range", () => {
        const range = CalculatorRange.numeric(10, 20, CalculatorId.generate());
        expect(range.contains(10)).toBe(true);
        expect(range.contains(15)).toBe(true);
        expect(range.contains(20)).toBe(false);
        expect(range.contains(5)).toBe(false);
        expect(range.contains(25)).toBe(false);
    });

    it("should support number values", () => {
        const range = CalculatorRange.numeric(0, 10, CalculatorId.generate());
        expect(range.supports(5)).toBe(true);
        expect(range.supports("5")).toBe(false);
    });

    it("should throw when min >= max", () => {
        expect(() => CalculatorRange.numeric(20, 10, CalculatorId.generate())).toThrow();
        expect(() => CalculatorRange.numeric(10, 10, CalculatorId.generate())).toThrow();
    });

    it("should detect overlap", () => {
        const r1 = CalculatorRange.numeric(0, 10, CalculatorId.generate());
        const r2 = CalculatorRange.numeric(5, 15, CalculatorId.generate());
        expect(r1.overlaps(r2)).toBe(true);
        expect(r2.overlaps(r1)).toBe(true);
    });

    it("should not detect overlap for adjacent ranges", () => {
        const r1 = CalculatorRange.numeric(0, 10, CalculatorId.generate());
        const r2 = CalculatorRange.numeric(10, 20, CalculatorId.generate());
        expect(r1.overlaps(r2)).toBe(false);
        expect(r2.overlaps(r1)).toBe(false);
    });

    it("should be compatible with other numeric ranges", () => {
        const r1 = CalculatorRange.numeric(0, 10, CalculatorId.generate());
        const r2 = CalculatorRange.numeric(20, 30, CalculatorId.generate());
        expect(r1.isCompatibleWith(r2)).toBe(true);
    });
});

describe("DateRange", () => {
    it("should contain date in range", () => {
        const range = CalculatorRange.date(date(2024, 6, 1), date(2024, 9, 1), CalculatorId.generate());
        expect(range.contains(date(2024, 6, 1))).toBe(true);
        expect(range.contains(date(2024, 7, 15))).toBe(true);
        expect(range.contains(date(2024, 8, 31))).toBe(true);
        expect(range.contains(date(2024, 9, 1))).toBe(false);
        expect(range.contains(date(2024, 5, 31))).toBe(false);
    });

    it("should throw when from not before to", () => {
        expect(() => CalculatorRange.date(date(2024, 9, 1), date(2024, 6, 1), CalculatorId.generate())).toThrow();
    });

    it("should detect overlap", () => {
        const summer = CalculatorRange.date(date(2024, 6, 1), date(2024, 9, 1), CalculatorId.generate());
        const lateSummer = CalculatorRange.date(date(2024, 8, 1), date(2024, 10, 1), CalculatorId.generate());
        expect(summer.overlaps(lateSummer)).toBe(true);
    });

    it("should not detect overlap for adjacent ranges", () => {
        const summer = CalculatorRange.date(date(2024, 6, 1), date(2024, 9, 1), CalculatorId.generate());
        const fall = CalculatorRange.date(date(2024, 9, 1), date(2024, 12, 1), CalculatorId.generate());
        expect(summer.overlaps(fall)).toBe(false);
    });

    it("should not be compatible with time range", () => {
        const dateRange = CalculatorRange.date(date(2024, 1, 1), date(2024, 12, 1), CalculatorId.generate());
        const timeRange = CalculatorRange.time(TimeOfDay.of(8, 0), TimeOfDay.of(18, 0), CalculatorId.generate());
        expect(dateRange.isCompatibleWith(timeRange)).toBe(false);
    });
});

describe("TimeRange", () => {
    it("should contain time in normal range", () => {
        const range = CalculatorRange.time(TimeOfDay.of(8, 0), TimeOfDay.of(18, 0), CalculatorId.generate());
        expect(range.contains(TimeOfDay.of(8, 0))).toBe(true);
        expect(range.contains(TimeOfDay.of(12, 0))).toBe(true);
        expect(range.contains(TimeOfDay.of(17, 59))).toBe(true);
        expect(range.contains(TimeOfDay.of(18, 0))).toBe(false);
        expect(range.contains(TimeOfDay.of(7, 59))).toBe(false);
    });

    it("should contain time in range crossing midnight", () => {
        const range = CalculatorRange.time(TimeOfDay.of(22, 0), TimeOfDay.of(6, 0), CalculatorId.generate());
        expect(range.contains(TimeOfDay.of(22, 0))).toBe(true);
        expect(range.contains(TimeOfDay.of(23, 30))).toBe(true);
        expect(range.contains(TimeOfDay.of(0, 0))).toBe(true);
        expect(range.contains(TimeOfDay.of(3, 0))).toBe(true);
        expect(range.contains(TimeOfDay.of(5, 59))).toBe(true);
        expect(range.contains(TimeOfDay.of(6, 0))).toBe(false);
        expect(range.contains(TimeOfDay.of(12, 0))).toBe(false);
    });

    it("should detect overlap when both normal", () => {
        const r1 = CalculatorRange.time(TimeOfDay.of(8, 0), TimeOfDay.of(18, 0), CalculatorId.generate());
        const r2 = CalculatorRange.time(TimeOfDay.of(15, 0), TimeOfDay.of(20, 0), CalculatorId.generate());
        expect(r1.overlaps(r2)).toBe(true);
    });

    it("should not detect overlap for adjacent normal ranges", () => {
        const r1 = CalculatorRange.time(TimeOfDay.of(8, 0), TimeOfDay.of(18, 0), CalculatorId.generate());
        const r2 = CalculatorRange.time(TimeOfDay.of(18, 0), TimeOfDay.of(22, 0), CalculatorId.generate());
        expect(r1.overlaps(r2)).toBe(false);
    });

    it("should not detect overlap when day fits in midnight gap", () => {
        const night = CalculatorRange.time(TimeOfDay.of(22, 0), TimeOfDay.of(6, 0), CalculatorId.generate());
        const day = CalculatorRange.time(TimeOfDay.of(8, 0), TimeOfDay.of(18, 0), CalculatorId.generate());
        expect(night.overlaps(day)).toBe(false);
        expect(day.overlaps(night)).toBe(false);
    });

    it("should detect overlap when both cross midnight", () => {
        const n1 = CalculatorRange.time(TimeOfDay.of(22, 0), TimeOfDay.of(6, 0), CalculatorId.generate());
        const n2 = CalculatorRange.time(TimeOfDay.of(20, 0), TimeOfDay.of(8, 0), CalculatorId.generate());
        expect(n1.overlaps(n2)).toBe(true);
    });
});
