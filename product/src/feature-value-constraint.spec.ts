import { describe, it, expect } from "vitest";
import { FeatureValueType, FeatureValueTypeOps } from "./feature-value-type";
import { NumericRangeConstraint } from "./numeric-range-constraint";
import { DecimalRangeConstraint } from "./decimal-range-constraint";
import { DateRangeConstraint } from "./date-range-constraint";
import { RegexConstraint } from "./regex-constraint";
import { AllowedValuesConstraint } from "./allowed-values-constraint";
import { Unconstrained } from "./unconstrained";

describe("NumericRangeConstraint", () => {
    it("should accept value within range", () => {
        const constraint = NumericRangeConstraint.between(1, 100);
        expect(constraint.isValid(1)).toBe(true);
        expect(constraint.isValid(50)).toBe(true);
        expect(constraint.isValid(100)).toBe(true);
    });

    it("should reject value outside range", () => {
        const constraint = NumericRangeConstraint.between(1, 100);
        expect(constraint.isValid(0)).toBe(false);
        expect(constraint.isValid(101)).toBe(false);
        expect(constraint.isValid(-5)).toBe(false);
    });

    it("should reject non-integer values", () => {
        const constraint = NumericRangeConstraint.between(1, 100);
        expect(constraint.isValid("50")).toBe(false);
        expect(constraint.isValid(50.5)).toBe(false);
        expect(constraint.isValid(null)).toBe(false);
    });

    it("should reject invalid range", () => {
        expect(() => NumericRangeConstraint.between(100, 1)).toThrow();
    });

    it("should allow same min and max", () => {
        const constraint = NumericRangeConstraint.between(42, 42);
        expect(constraint.isValid(42)).toBe(true);
        expect(constraint.isValid(41)).toBe(false);
    });

    it("should have correct value type", () => {
        const constraint = NumericRangeConstraint.between(1, 100);
        expect(constraint.valueType()).toBe(FeatureValueType.INTEGER);
        expect(constraint.type()).toBe("NUMERIC_RANGE");
    });

    it("should convert from string", () => {
        const constraint = NumericRangeConstraint.between(1, 100);
        expect(constraint.fromString("50")).toBe(50);
    });

    it("should reject invalid value from string", () => {
        const constraint = NumericRangeConstraint.between(1, 100);
        expect(() => constraint.fromString("150")).toThrow();
    });
});

describe("DecimalRangeConstraint", () => {
    it("should accept value within range", () => {
        const constraint = DecimalRangeConstraint.of("0.5", "100.0");
        expect(constraint.isValid(0.5)).toBe(true);
        expect(constraint.isValid(50.25)).toBe(true);
        expect(constraint.isValid(100.0)).toBe(true);
    });

    it("should reject value outside range", () => {
        const constraint = DecimalRangeConstraint.of("0.5", "100.0");
        expect(constraint.isValid(0.4)).toBe(false);
        expect(constraint.isValid(100.1)).toBe(false);
    });

    it("should reject non-number values", () => {
        const constraint = DecimalRangeConstraint.of("0.5", "100.0");
        expect(constraint.isValid("50.0")).toBe(false);
        expect(constraint.isValid(null)).toBe(false);
    });

    it("should reject invalid range", () => {
        expect(() => DecimalRangeConstraint.of("100.0", "0.5")).toThrow();
    });

    it("should have correct value type", () => {
        const constraint = DecimalRangeConstraint.of("0.5", "100.0");
        expect(constraint.valueType()).toBe(FeatureValueType.DECIMAL);
        expect(constraint.type()).toBe("DECIMAL_RANGE");
    });

    it("should convert from string", () => {
        const constraint = DecimalRangeConstraint.of("0.5", "100.0");
        expect(constraint.fromString("50.25")).toBe(50.25);
    });
});

describe("DateRangeConstraint", () => {
    it("should accept date within range", () => {
        const constraint = DateRangeConstraint.between("2024-01-01", "2024-12-31");
        expect(constraint.isValid("2024-01-01")).toBe(true);
        expect(constraint.isValid("2024-06-15")).toBe(true);
        expect(constraint.isValid("2024-12-31")).toBe(true);
    });

    it("should reject date outside range", () => {
        const constraint = DateRangeConstraint.between("2024-01-01", "2024-12-31");
        expect(constraint.isValid("2023-12-31")).toBe(false);
        expect(constraint.isValid("2025-01-01")).toBe(false);
    });

    it("should reject non-date values", () => {
        const constraint = DateRangeConstraint.between("2024-01-01", "2024-12-31");
        expect(constraint.isValid(20240615)).toBe(false);
        expect(constraint.isValid(null)).toBe(false);
    });

    it("should reject invalid range", () => {
        expect(() => DateRangeConstraint.between("2024-12-31", "2024-01-01")).toThrow();
    });

    it("should have correct value type", () => {
        const constraint = DateRangeConstraint.between("2024-01-01", "2024-12-31");
        expect(constraint.valueType()).toBe(FeatureValueType.DATE);
        expect(constraint.type()).toBe("DATE_RANGE");
    });

    it("should convert from string", () => {
        const constraint = DateRangeConstraint.between("2024-01-01", "2024-12-31");
        expect(constraint.fromString("2024-06-15")).toBe("2024-06-15");
    });
});

describe("RegexConstraint", () => {
    it("should accept matching value", () => {
        const constraint = RegexConstraint.of("^[A-Z]{2}-\\d{4}$");
        expect(constraint.isValid("AB-1234")).toBe(true);
        expect(constraint.isValid("XY-9999")).toBe(true);
    });

    it("should reject non-matching value", () => {
        const constraint = RegexConstraint.of("^[A-Z]{2}-\\d{4}$");
        expect(constraint.isValid("ab-1234")).toBe(false);
        expect(constraint.isValid("ABC-1234")).toBe(false);
        expect(constraint.isValid("AB-123")).toBe(false);
    });

    it("should reject non-string values", () => {
        const constraint = RegexConstraint.of("^\\d+$");
        expect(constraint.isValid(123)).toBe(false);
        expect(constraint.isValid(null)).toBe(false);
    });

    it("should reject blank pattern", () => {
        expect(() => RegexConstraint.of("")).toThrow();
        expect(() => RegexConstraint.of("   ")).toThrow();
    });

    it("should have correct value type", () => {
        const constraint = RegexConstraint.of("^[A-Z]+$");
        expect(constraint.valueType()).toBe(FeatureValueType.TEXT);
        expect(constraint.type()).toBe("REGEX");
    });
});

describe("AllowedValuesConstraint", () => {
    it("should accept allowed value", () => {
        const constraint = AllowedValuesConstraint.of("red", "blue", "green");
        expect(constraint.isValid("red")).toBe(true);
        expect(constraint.isValid("blue")).toBe(true);
    });

    it("should reject not allowed value", () => {
        const constraint = AllowedValuesConstraint.of("red", "blue", "green");
        expect(constraint.isValid("yellow")).toBe(false);
        expect(constraint.isValid("RED")).toBe(false);
    });

    it("should reject non-string values", () => {
        const constraint = AllowedValuesConstraint.of("1", "2", "3");
        expect(constraint.isValid(1)).toBe(false);
        expect(constraint.isValid(null)).toBe(false);
    });

    it("should reject empty allowed values", () => {
        expect(() => AllowedValuesConstraint.of()).toThrow();
    });

    it("should have correct value type", () => {
        const constraint = AllowedValuesConstraint.of("a", "b", "c");
        expect(constraint.valueType()).toBe(FeatureValueType.TEXT);
        expect(constraint.type()).toBe("ALLOWED_VALUES");
    });
});

describe("Unconstrained", () => {
    it("should accept any text value", () => {
        const constraint = new Unconstrained(FeatureValueType.TEXT);
        expect(constraint.isValid("anything")).toBe(true);
        expect(constraint.isValid("")).toBe(true);
    });

    it("should accept any integer value", () => {
        const constraint = new Unconstrained(FeatureValueType.INTEGER);
        expect(constraint.isValid(0)).toBe(true);
        expect(constraint.isValid(-100)).toBe(true);
    });

    it("should accept any decimal value", () => {
        const constraint = new Unconstrained(FeatureValueType.DECIMAL);
        expect(constraint.isValid(0)).toBe(true);
        expect(constraint.isValid(-100.5)).toBe(true);
    });

    it("should accept any boolean value", () => {
        const constraint = new Unconstrained(FeatureValueType.BOOLEAN);
        expect(constraint.isValid(true)).toBe(true);
        expect(constraint.isValid(false)).toBe(true);
    });

    it("should reject wrong type", () => {
        const textConstraint = new Unconstrained(FeatureValueType.TEXT);
        const intConstraint = new Unconstrained(FeatureValueType.INTEGER);
        expect(textConstraint.isValid(123)).toBe(false);
        expect(intConstraint.isValid("123")).toBe(false);
    });

    it("should reject null value type", () => {
        expect(() => new Unconstrained(null as unknown as FeatureValueType)).toThrow();
    });

    it("should have correct type identifier", () => {
        const constraint = new Unconstrained(FeatureValueType.TEXT);
        expect(constraint.type()).toBe("UNCONSTRAINED");
    });
});

describe("FeatureValueTypeOps", () => {
    it("should cast text from string", () => {
        expect(FeatureValueTypeOps.castFrom(FeatureValueType.TEXT, "hello")).toBe("hello");
    });

    it("should cast integer from string", () => {
        expect(FeatureValueTypeOps.castFrom(FeatureValueType.INTEGER, "42")).toBe(42);
    });

    it("should cast decimal from string", () => {
        expect(FeatureValueTypeOps.castFrom(FeatureValueType.DECIMAL, "42.5")).toBe(42.5);
    });

    it("should cast date from string", () => {
        expect(FeatureValueTypeOps.castFrom(FeatureValueType.DATE, "2024-06-15")).toBe("2024-06-15");
    });

    it("should cast boolean from string", () => {
        expect(FeatureValueTypeOps.castFrom(FeatureValueType.BOOLEAN, "true")).toBe(true);
        expect(FeatureValueTypeOps.castFrom(FeatureValueType.BOOLEAN, "false")).toBe(false);
    });

    it("should check instance correctly", () => {
        expect(FeatureValueTypeOps.isInstance(FeatureValueType.TEXT, "hello")).toBe(true);
        expect(FeatureValueTypeOps.isInstance(FeatureValueType.INTEGER, 42)).toBe(true);
        expect(FeatureValueTypeOps.isInstance(FeatureValueType.DECIMAL, 42.5)).toBe(true);
        expect(FeatureValueTypeOps.isInstance(FeatureValueType.BOOLEAN, true)).toBe(true);
        expect(FeatureValueTypeOps.isInstance(FeatureValueType.TEXT, 42)).toBe(false);
        expect(FeatureValueTypeOps.isInstance(FeatureValueType.INTEGER, "42")).toBe(false);
    });
});
