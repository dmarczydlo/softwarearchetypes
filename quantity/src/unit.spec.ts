import { describe, it, expect } from "vitest";
import { Unit } from "./unit";

describe("Unit", () => {

    it("should create a unit with symbol and name", () => {
        const unit = Unit.of("kg", "kilograms");
        expect(unit.symbol).toBe("kg");
        expect(unit.name).toBe("kilograms");
    });

    it("should throw when symbol is blank", () => {
        expect(() => Unit.of("", "kilograms")).toThrow("Unit symbol cannot be null or blank");
        expect(() => Unit.of("   ", "kilograms")).toThrow("Unit symbol cannot be null or blank");
    });

    it("should throw when name is blank", () => {
        expect(() => Unit.of("kg", "")).toThrow("Unit name cannot be null or blank");
        expect(() => Unit.of("kg", "   ")).toThrow("Unit name cannot be null or blank");
    });

    it("should create predefined units", () => {
        expect(Unit.pieces().symbol).toBe("pcs");
        expect(Unit.kilograms().symbol).toBe("kg");
        expect(Unit.liters().symbol).toBe("l");
        expect(Unit.meters().symbol).toBe("m");
        expect(Unit.squareMeters().symbol).toBe("m\u00B2");
        expect(Unit.cubicMeters().symbol).toBe("m\u00B3");
        expect(Unit.hours().symbol).toBe("h");
        expect(Unit.minutes().symbol).toBe("min");
        expect(Unit.packages().symbol).toBe("pkg");
        expect(Unit.accounts().symbol).toBe("acc");
    });

    it("should return symbol as toString", () => {
        const unit = Unit.of("kg", "kilograms");
        expect(unit.toString()).toBe("kg");
    });

    it("should compare equality", () => {
        const unit1 = Unit.of("kg", "kilograms");
        const unit2 = Unit.of("kg", "kilograms");
        const unit3 = Unit.of("l", "liters");

        expect(unit1.equals(unit2)).toBe(true);
        expect(unit1.equals(unit3)).toBe(false);
    });
});
