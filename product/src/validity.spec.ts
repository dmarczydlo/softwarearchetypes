import { describe, it, expect } from "vitest";
import { Validity } from "./validity";

describe("Validity", () => {
    it("should be valid within period", () => {
        const validity = Validity.between("2024-01-01", "2024-12-31");
        expect(validity.isValidAt("2024-01-01")).toBe(true);
        expect(validity.isValidAt("2024-06-15")).toBe(true);
        expect(validity.isValidAt("2024-12-31")).toBe(true);
    });

    it("should not be valid outside period", () => {
        const validity = Validity.between("2024-01-01", "2024-12-31");
        expect(validity.isValidAt("2023-12-31")).toBe(false);
        expect(validity.isValidAt("2025-01-01")).toBe(false);
    });

    it("should always be valid with always()", () => {
        const validity = Validity.always();
        expect(validity.isValidAt("1900-01-01")).toBe(true);
        expect(validity.isValidAt("2100-12-31")).toBe(true);
    });

    it("should validate from date only", () => {
        const validity = Validity.from("2024-01-01");
        expect(validity.isValidAt("2023-12-31")).toBe(false);
        expect(validity.isValidAt("2024-01-01")).toBe(true);
        expect(validity.isValidAt("2100-01-01")).toBe(true);
    });

    it("should validate until date only", () => {
        const validity = Validity.until("2024-12-31");
        expect(validity.isValidAt("1900-01-01")).toBe(true);
        expect(validity.isValidAt("2024-12-31")).toBe(true);
        expect(validity.isValidAt("2025-01-01")).toBe(false);
    });

    it("should reject from after to", () => {
        expect(() => Validity.between("2024-12-31", "2024-01-01")).toThrow();
    });

    it("should support equality", () => {
        const v1 = Validity.between("2024-01-01", "2024-12-31");
        const v2 = Validity.between("2024-01-01", "2024-12-31");
        expect(v1.equals(v2)).toBe(true);
    });
});
