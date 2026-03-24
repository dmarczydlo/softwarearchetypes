import { describe, it, expect } from "vitest";
import {
    alwaysTrue, equalsTo, inValues, greaterThan, greaterThanOrEqualTo,
    lessThan, lessThanOrEqualTo, between, and, or, not,
} from "./ApplicabilityConstraint.js";
import { PricingContext } from "./PricingContext.js";
import { Parameters } from "./Parameters.js";

function emptyCtx(): PricingContext {
    return PricingContext.from(Parameters.empty());
}

function ctx(k1: string, v1: unknown, k2?: string, v2?: unknown): PricingContext {
    if (k2 !== undefined) {
        return PricingContext.from(Parameters.of(k1, v1, k2, v2!));
    }
    return PricingContext.from(Parameters.of(k1, v1));
}

describe("ApplicabilityConstraint", () => {
    it("alwaysTrue is satisfied by any context", () => {
        expect(alwaysTrue().isSatisfiedBy(emptyCtx())).toBe(true);
        expect(alwaysTrue().isSatisfiedBy(ctx("anything", "value"))).toBe(true);
    });

    it("equalsTo matches exact string value", () => {
        const constraint = equalsTo("cargo-type", "hazmat");
        expect(constraint.isSatisfiedBy(ctx("cargo-type", "hazmat"))).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("cargo-type", "standard"))).toBe(false);
    });

    it("equalsTo returns false when parameter absent", () => {
        expect(equalsTo("cargo-type", "hazmat").isSatisfiedBy(emptyCtx())).toBe(false);
    });

    it("in matches any value from allowed set", () => {
        const constraint = inValues("zone", "A", "B", "C");
        expect(constraint.isSatisfiedBy(ctx("zone", "A"))).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("zone", "C"))).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("zone", "D"))).toBe(false);
    });

    it("greaterThan is satisfied strictly above threshold", () => {
        const constraint = greaterThan("weight", 10);
        expect(constraint.isSatisfiedBy(ctx("weight", 11))).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("weight", 10))).toBe(false);
        expect(constraint.isSatisfiedBy(ctx("weight", 9))).toBe(false);
    });

    it("greaterThan returns false for non-numeric value", () => {
        expect(greaterThan("weight", 10).isSatisfiedBy(ctx("weight", "heavy"))).toBe(false);
    });

    it("greaterThanOrEqualTo is satisfied at and above threshold", () => {
        const constraint = greaterThanOrEqualTo("quantity", 5);
        expect(constraint.isSatisfiedBy(ctx("quantity", 5))).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("quantity", 10))).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("quantity", 4))).toBe(false);
    });

    it("lessThan is satisfied strictly below threshold", () => {
        const constraint = lessThan("sessions", 5);
        expect(constraint.isSatisfiedBy(ctx("sessions", 4))).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("sessions", 5))).toBe(false);
        expect(constraint.isSatisfiedBy(ctx("sessions", 6))).toBe(false);
    });

    it("lessThanOrEqualTo is satisfied at and below threshold", () => {
        const constraint = lessThanOrEqualTo("quantity", 100);
        expect(constraint.isSatisfiedBy(ctx("quantity", 100))).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("quantity", 50))).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("quantity", 101))).toBe(false);
    });

    it("between is satisfied within inclusive bounds", () => {
        const constraint = between("weight", 5, 30);
        expect(constraint.isSatisfiedBy(ctx("weight", 5))).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("weight", 17))).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("weight", 30))).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("weight", 4))).toBe(false);
        expect(constraint.isSatisfiedBy(ctx("weight", 31))).toBe(false);
    });

    it("and requires all constraints satisfied", () => {
        const constraint = and(equalsTo("type", "B2C"), greaterThan("sessions", 10));
        expect(constraint.isSatisfiedBy(ctx("type", "B2C", "sessions", 15))).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("type", "B2C", "sessions", 5))).toBe(false);
        expect(constraint.isSatisfiedBy(ctx("type", "B2B", "sessions", 15))).toBe(false);
    });

    it("or is satisfied by at least one constraint", () => {
        const constraint = or(equalsTo("status", "gold"), equalsTo("status", "platinum"));
        expect(constraint.isSatisfiedBy(ctx("status", "gold"))).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("status", "platinum"))).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("status", "silver"))).toBe(false);
    });

    it("not negates constraint", () => {
        const constraint = not(equalsTo("excluded", "true"));
        expect(constraint.isSatisfiedBy(ctx("excluded", "false"))).toBe(true);
        expect(constraint.isSatisfiedBy(emptyCtx())).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("excluded", "true"))).toBe(false);
    });

    it("should support deep composition - or of ands", () => {
        const constraint = or(
            and(equalsTo("type", "B2C"), greaterThanOrEqualTo("weight", 5)),
            and(equalsTo("type", "B2B"), greaterThanOrEqualTo("weight", 3))
        );
        expect(constraint.isSatisfiedBy(ctx("type", "B2C", "weight", 7))).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("type", "B2B", "weight", 4))).toBe(true);
        expect(constraint.isSatisfiedBy(ctx("type", "B2C", "weight", 2))).toBe(false);
        expect(constraint.isSatisfiedBy(ctx("type", "B2B", "weight", 1))).toBe(false);
    });
});
