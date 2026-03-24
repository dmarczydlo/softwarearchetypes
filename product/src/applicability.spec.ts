import { describe, it, expect, beforeEach } from "vitest";
import { Unit } from "@softwarearchetypes/quantity";
import {
    ApplicabilityContext,
    ApplicabilityConstraintFactory,
} from "./applicability";
import { ProductType } from "./product-type";
import { ProductBuilder } from "./product-builder";
import { UuidProductIdentifier } from "./product-identifier";
import { ProductName } from "./product-name";
import { ProductDescription } from "./product-description";
import { ProductTrackingStrategy } from "./product-tracking-strategy";

const { alwaysTrue, equalsTo, in: inConstraint, greaterThan, lessThan, between, and, or, not } = ApplicabilityConstraintFactory;

describe("ApplicabilityConstraint", () => {

    it("should satisfy equalsTo constraint", () => {
        const constraint = equalsTo("country", "PL");
        const context = ApplicabilityContext.of({ country: "PL" });
        expect(constraint.isSatisfiedBy(context)).toBe(true);
    });

    it("should not satisfy equalsTo constraint when value different", () => {
        const constraint = equalsTo("country", "PL");
        const context = ApplicabilityContext.of({ country: "UK" });
        expect(constraint.isSatisfiedBy(context)).toBe(false);
    });

    it("should not satisfy equalsTo constraint when parameter missing", () => {
        const constraint = equalsTo("country", "PL");
        const context = ApplicabilityContext.empty();
        expect(constraint.isSatisfiedBy(context)).toBe(false);
    });

    it("should satisfy in constraint when value in set", () => {
        const constraint = inConstraint("channel", "mobile", "web", "tablet");
        const context = ApplicabilityContext.of({ channel: "mobile" });
        expect(constraint.isSatisfiedBy(context)).toBe(true);
    });

    it("should not satisfy in constraint when value not in set", () => {
        const constraint = inConstraint("channel", "mobile", "web");
        const context = ApplicabilityContext.of({ channel: "desktop" });
        expect(constraint.isSatisfiedBy(context)).toBe(false);
    });

    it("should satisfy greaterThan constraint", () => {
        const constraint = greaterThan("age", 18);
        const context = ApplicabilityContext.of({ age: "25" });
        expect(constraint.isSatisfiedBy(context)).toBe(true);
    });

    it("should not satisfy greaterThan constraint when equal", () => {
        const constraint = greaterThan("age", 18);
        const context = ApplicabilityContext.of({ age: "18" });
        expect(constraint.isSatisfiedBy(context)).toBe(false);
    });

    it("should not satisfy greaterThan constraint when not numeric", () => {
        const constraint = greaterThan("age", 18);
        const context = ApplicabilityContext.of({ age: "adult" });
        expect(constraint.isSatisfiedBy(context)).toBe(false);
    });

    it("should satisfy lessThan constraint", () => {
        const constraint = lessThan("age", 16);
        const context = ApplicabilityContext.of({ age: "12" });
        expect(constraint.isSatisfiedBy(context)).toBe(true);
    });

    it("should not satisfy lessThan constraint when greater", () => {
        const constraint = lessThan("age", 16);
        const context = ApplicabilityContext.of({ age: "20" });
        expect(constraint.isSatisfiedBy(context)).toBe(false);
    });

    it("should satisfy between constraint", () => {
        const constraint = between("age", 18, 65);
        const context = ApplicabilityContext.of({ age: "30" });
        expect(constraint.isSatisfiedBy(context)).toBe(true);
    });

    it("should satisfy between constraint at min boundary", () => {
        const constraint = between("age", 18, 65);
        const context = ApplicabilityContext.of({ age: "18" });
        expect(constraint.isSatisfiedBy(context)).toBe(true);
    });

    it("should satisfy between constraint at max boundary", () => {
        const constraint = between("age", 18, 65);
        const context = ApplicabilityContext.of({ age: "65" });
        expect(constraint.isSatisfiedBy(context)).toBe(true);
    });

    it("should not satisfy between constraint when outside range", () => {
        const constraint = between("age", 18, 65);
        const context = ApplicabilityContext.of({ age: "70" });
        expect(constraint.isSatisfiedBy(context)).toBe(false);
    });

    it("should satisfy and constraint when all constraints met", () => {
        const constraint = and(equalsTo("country", "PL"), equalsTo("channel", "mobile"));
        const context = ApplicabilityContext.of({ country: "PL", channel: "mobile" });
        expect(constraint.isSatisfiedBy(context)).toBe(true);
    });

    it("should not satisfy and constraint when one constraint not met", () => {
        const constraint = and(equalsTo("country", "PL"), equalsTo("channel", "mobile"));
        const context = ApplicabilityContext.of({ country: "PL", channel: "web" });
        expect(constraint.isSatisfiedBy(context)).toBe(false);
    });

    it("should satisfy or constraint when any constraint met", () => {
        const constraint = or(equalsTo("country", "PL"), equalsTo("country", "UK"));
        const context = ApplicabilityContext.of({ country: "UK" });
        expect(constraint.isSatisfiedBy(context)).toBe(true);
    });

    it("should not satisfy or constraint when no constraint met", () => {
        const constraint = or(equalsTo("country", "PL"), equalsTo("country", "UK"));
        const context = ApplicabilityContext.of({ country: "DE" });
        expect(constraint.isSatisfiedBy(context)).toBe(false);
    });

    it("should satisfy not constraint", () => {
        const constraint = not(equalsTo("country", "PL"));
        const context = ApplicabilityContext.of({ country: "UK" });
        expect(constraint.isSatisfiedBy(context)).toBe(true);
    });

    it("should not satisfy not constraint", () => {
        const constraint = not(equalsTo("country", "PL"));
        const context = ApplicabilityContext.of({ country: "PL" });
        expect(constraint.isSatisfiedBy(context)).toBe(false);
    });

    it("should satisfy complex nested constraint", () => {
        const constraint = and(
            or(equalsTo("country", "PL"), equalsTo("country", "UK")),
            or(equalsTo("channel", "mobile"), equalsTo("channel", "web")),
            lessThan("age", 16)
        );
        const context = ApplicabilityContext.of({ country: "UK", channel: "mobile", age: "12" });
        expect(constraint.isSatisfiedBy(context)).toBe(true);
    });

    it("should not satisfy complex nested constraint when one part fails", () => {
        const constraint = and(
            or(equalsTo("country", "PL"), equalsTo("country", "UK")),
            or(equalsTo("channel", "mobile"), equalsTo("channel", "web")),
            lessThan("age", 16)
        );
        const context = ApplicabilityContext.of({ country: "UK", channel: "mobile", age: "18" });
        expect(constraint.isSatisfiedBy(context)).toBe(false);
    });

    it("should satisfy alwaysTrue constraint", () => {
        const constraint = alwaysTrue();
        expect(constraint.isSatisfiedBy(ApplicabilityContext.empty())).toBe(true);
    });

    it("should use applicability constraint in ProductType", () => {
        const mobileOnlyProduct = ProductType.builder(
            UuidProductIdentifier.random(),
            ProductName.of("Mobile App Premium"),
            ProductDescription.of("Premium feature available only on mobile"),
            Unit.pieces(),
            ProductTrackingStrategy.IDENTICAL
        )
        .withApplicabilityConstraint(equalsTo("channel", "mobile"))
        .build();

        expect(mobileOnlyProduct.isApplicableFor(ApplicabilityContext.of({ channel: "mobile" }))).toBe(true);
        expect(mobileOnlyProduct.isApplicableFor(ApplicabilityContext.of({ channel: "web" }))).toBe(false);
    });

    it("should use default alwaysTrue constraint when not specified", () => {
        const product = ProductType.identical(
            UuidProductIdentifier.random(),
            ProductName.of("Universal Product"),
            ProductDescription.of("No restrictions"),
            Unit.pieces()
        );

        expect(product.isApplicableFor(ApplicabilityContext.empty())).toBe(true);
        expect(product.isApplicableFor(ApplicabilityContext.of({ country: "PL" }))).toBe(true);
    });

    it("should use between for range constraints", () => {
        const product = ProductType.builder(
            UuidProductIdentifier.random(),
            ProductName.of("Teen Product"),
            ProductDescription.of("For teenagers only"),
            Unit.pieces(),
            ProductTrackingStrategy.IDENTICAL
        )
        .withApplicabilityConstraint(between("age", 13, 19))
        .build();

        expect(product.isApplicableFor(ApplicabilityContext.of({ age: "15" }))).toBe(true);
        expect(product.isApplicableFor(ApplicabilityContext.of({ age: "10" }))).toBe(false);
        expect(product.isApplicableFor(ApplicabilityContext.of({ age: "25" }))).toBe(false);
    });
});
