import { describe, it, expect } from "vitest";
import { Percentage } from "./percentage";

describe("Percentage", () => {

    it("should create a percentage", () => {
        const p = Percentage.of(23);
        expect(p.value).toBe(23);
    });

    it("should create a percentage from fraction", () => {
        const p = Percentage.ofFraction(0.23);
        expect(p.value).toBe(23);
    });

    it("should create 100%", () => {
        const p = Percentage.oneHundred();
        expect(p.value).toBe(100);
    });

    it("should create 0%", () => {
        const p = Percentage.zero();
        expect(p.value).toBe(0);
    });

    it("should throw for negative value", () => {
        expect(() => Percentage.of(-1)).toThrow("Percentage value cannot be negative");
    });

    it("should allow zero value", () => {
        const p = Percentage.of(0);
        expect(p.value).toBe(0);
    });

    it("should add percentages", () => {
        const p1 = Percentage.of(10);
        const p2 = Percentage.of(15);
        const result = p1.add(p2);

        expect(result.value).toBe(25);
    });

    it("should subtract percentages", () => {
        const p1 = Percentage.of(25);
        const p2 = Percentage.of(10);
        const result = p1.subtract(p2);

        expect(result.value).toBe(15);
    });

    it("should multiply percentages", () => {
        const p1 = Percentage.of(50);
        const p2 = Percentage.of(50);
        const result = p1.multiply(p2);

        expect(result.value).toBe(25);
    });

    it("should check equality", () => {
        const p1 = Percentage.of(23);
        const p2 = Percentage.of(23);
        const p3 = Percentage.of(10);

        expect(p1.equals(p2)).toBe(true);
        expect(p1.equals(p3)).toBe(false);
    });

    it("should return string representation", () => {
        const p = Percentage.of(23);
        expect(p.toString()).toBe("23%");
    });

    it("should handle fractional percentages", () => {
        const p = Percentage.of(23.5);
        expect(p.value).toBe(23.5);
        expect(p.toString()).toBe("23.5%");
    });

    it("should round to 5 decimal places", () => {
        const p = Percentage.ofFraction(0.123456789);
        expect(p.value).toBe(12.34568);
    });
});
