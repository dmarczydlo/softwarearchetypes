import { describe, it, expect } from "vitest";
import { Validity } from "./Validity.js";

function date(y: number, m: number, d: number, h = 0, min = 0): Date {
    return new Date(y, m - 1, d, h, min);
}

describe("Validity", () => {
    it("should create validity from date", () => {
        const from = date(2024, 1, 1);
        const validity = Validity.from(from);
        expect(validity.validFrom.getTime()).toBe(from.getTime());
        expect(validity.validTo.getTime()).toBe(new Date(8640000000000000).getTime());
    });

    it("should create validity between dates", () => {
        const from = date(2024, 1, 1);
        const to = date(2024, 2, 1);
        const validity = Validity.between(from, to);
        expect(validity.validFrom.getTime()).toBe(from.getTime());
        expect(validity.validTo.getTime()).toBe(to.getTime());
    });

    it("should reject invalid range", () => {
        const from = date(2024, 2, 1);
        const to = date(2024, 1, 1);
        expect(() => Validity.between(from, to)).toThrow("validFrom must be before validTo");
    });

    it("should check if valid at", () => {
        const validity = Validity.between(date(2024, 2, 1), date(2024, 3, 1));
        expect(validity.isValidAt(date(2024, 1, 31, 23, 59))).toBe(false);
        expect(validity.isValidAt(date(2024, 2, 1))).toBe(true);
        expect(validity.isValidAt(date(2024, 2, 15))).toBe(true);
        expect(validity.isValidAt(date(2024, 2, 28, 23, 59))).toBe(true);
        expect(validity.isValidAt(date(2024, 3, 1))).toBe(false);
        expect(validity.isValidAt(date(2024, 3, 2))).toBe(false);
    });

    it("should detect overlapping periods", () => {
        const v1 = Validity.between(date(2024, 1, 1), date(2024, 3, 1));
        const v2 = Validity.between(date(2024, 2, 1), date(2024, 4, 1));
        expect(v1.overlaps(v2)).toBe(true);
        expect(v2.overlaps(v1)).toBe(true);
    });

    it("should detect non-overlapping periods", () => {
        const v1 = Validity.between(date(2024, 1, 1), date(2024, 2, 1));
        const v2 = Validity.between(date(2024, 2, 1), date(2024, 3, 1));
        expect(v1.overlaps(v2)).toBe(false);
        expect(v2.overlaps(v1)).toBe(false);
    });

    it("should handle open-ended validity", () => {
        const openEnded = Validity.from(date(2024, 1, 1));
        const limited = Validity.between(date(2024, 2, 1), date(2024, 3, 1));
        expect(openEnded.overlaps(limited)).toBe(true);
        expect(limited.overlaps(openEnded)).toBe(true);
        expect(openEnded.isValidAt(date(2100, 1, 1))).toBe(true);
    });

    it("should check if expired", () => {
        const validity = Validity.between(date(2024, 1, 1), date(2024, 2, 1));
        expect(validity.hasExpired(date(2024, 1, 15))).toBe(false);
        expect(validity.hasExpired(date(2024, 2, 1))).toBe(true);
        expect(validity.hasExpired(date(2024, 3, 1))).toBe(true);
    });

    it("should check if not started yet", () => {
        const validity = Validity.from(date(2024, 2, 1));
        expect(validity.hasNotStartedYet(date(2024, 1, 15))).toBe(true);
        expect(validity.hasNotStartedYet(date(2024, 2, 1))).toBe(false);
        expect(validity.hasNotStartedYet(date(2024, 3, 1))).toBe(false);
    });

    it("should create always validity", () => {
        const always = Validity.always();
        expect(always.isValidAt(date(2024, 1, 1))).toBe(true);
    });
});
