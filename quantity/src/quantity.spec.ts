import { describe, it, expect } from "vitest";
import { Quantity } from "./quantity";
import { Unit } from "./unit";

describe("Quantity", () => {

    it("should create a quantity with amount and unit", () => {
        const quantity = Quantity.of(10, Unit.pieces());
        expect(quantity.amount).toBe(10);
        expect(quantity.unit.symbol).toBe("pcs");
    });

    it("should create a quantity with decimal amount", () => {
        const quantity = Quantity.of(2.5, Unit.kilograms());
        expect(quantity.amount).toBe(2.5);
    });

    it("should allow zero amount", () => {
        const quantity = Quantity.of(0, Unit.pieces());
        expect(quantity.amount).toBe(0);
    });

    it("should throw when amount is negative", () => {
        expect(() => Quantity.of(-1, Unit.pieces())).toThrow("Amount cannot be negative");
    });

    it("should add quantities with the same unit", () => {
        const q1 = Quantity.of(5, Unit.pieces());
        const q2 = Quantity.of(3, Unit.pieces());
        const result = q1.add(q2);

        expect(result.amount).toBe(8);
        expect(result.unit.equals(Unit.pieces())).toBe(true);
    });

    it("should throw when adding quantities with different units", () => {
        const q1 = Quantity.of(5, Unit.pieces());
        const q2 = Quantity.of(3, Unit.kilograms());

        expect(() => q1.add(q2)).toThrow("Cannot add quantities with different units");
    });

    it("should subtract quantities with the same unit", () => {
        const q1 = Quantity.of(5, Unit.pieces());
        const q2 = Quantity.of(3, Unit.pieces());
        const result = q1.subtract(q2);

        expect(result.amount).toBe(2);
        expect(result.unit.equals(Unit.pieces())).toBe(true);
    });

    it("should throw when subtracting quantities with different units", () => {
        const q1 = Quantity.of(5, Unit.pieces());
        const q2 = Quantity.of(3, Unit.kilograms());

        expect(() => q1.subtract(q2)).toThrow("Cannot subtract quantities with different units");
    });

    it("should throw when subtraction results in negative amount", () => {
        const q1 = Quantity.of(3, Unit.pieces());
        const q2 = Quantity.of(5, Unit.pieces());

        expect(() => q1.subtract(q2)).toThrow("Amount cannot be negative");
    });

    it("should compare quantities", () => {
        const q1 = Quantity.of(5, Unit.pieces());
        const q2 = Quantity.of(3, Unit.pieces());
        const q3 = Quantity.of(5, Unit.pieces());

        expect(q1.compareTo(q2)).toBe(1);
        expect(q2.compareTo(q1)).toBe(-1);
        expect(q1.compareTo(q3)).toBe(0);
    });

    it("should check equality", () => {
        const q1 = Quantity.of(5, Unit.pieces());
        const q2 = Quantity.of(5, Unit.pieces());
        const q3 = Quantity.of(3, Unit.pieces());

        expect(q1.equals(q2)).toBe(true);
        expect(q1.equals(q3)).toBe(false);
    });

    it("should return string representation", () => {
        const quantity = Quantity.of(10, Unit.pieces());
        expect(quantity.toString()).toBe("10 pcs");
    });
});
