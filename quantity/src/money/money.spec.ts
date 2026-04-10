import { describe, it, expect } from "vitest";
import { Money } from "./money";
import { Percentage } from "./percentage";

describe("Money", () => {

    describe("creation", () => {

        it("should create money with amount and currency", () => {
            const money = Money.of(100, "PLN");
            expect(money.amount).toBe(100);
            expect(money.currencyCode).toBe("PLN");
        });

        it("should create PLN", () => {
            const money = Money.pln(100);
            expect(money.amount).toBe(100);
            expect(money.currency()).toBe("PLN");
        });

        it("should create EUR", () => {
            const money = Money.eur(100);
            expect(money.currency()).toBe("EUR");
        });

        it("should create GBP", () => {
            const money = Money.gbp(100);
            expect(money.currency()).toBe("GBP");
        });

        it("should create USD", () => {
            const money = Money.usd(100);
            expect(money.currency()).toBe("USD");
        });

        it("should create zero PLN", () => {
            const money = Money.zeroPln();
            expect(money.amount).toBe(0);
            expect(money.currency()).toBe("PLN");
        });

        it("should create zero EUR", () => {
            const money = Money.zeroEur();
            expect(money.amount).toBe(0);
            expect(money.currency()).toBe("EUR");
        });

        it("should create zero GBP", () => {
            const money = Money.zeroGbp();
            expect(money.amount).toBe(0);
            expect(money.currency()).toBe("GBP");
        });

        it("should create zero USD", () => {
            const money = Money.zeroUsd();
            expect(money.amount).toBe(0);
            expect(money.currency()).toBe("USD");
        });

        it("should round to 2 decimal places", () => {
            const money = Money.pln(10.555);
            expect(money.amount).toBe(10.56);
        });
    });

    describe("arithmetic", () => {

        it("should add money with same currency", () => {
            const result = Money.pln(10).add(Money.pln(20));
            expect(result.amount).toBe(30);
            expect(result.currency()).toBe("PLN");
        });

        it("should throw when adding different currencies", () => {
            expect(() => Money.pln(10).add(Money.eur(20))).toThrow("Currency mismatch");
        });

        it("should subtract money with same currency", () => {
            const result = Money.pln(30).subtract(Money.pln(10));
            expect(result.amount).toBe(20);
        });

        it("should allow negative result from subtraction", () => {
            const result = Money.pln(10).subtract(Money.pln(30));
            expect(result.amount).toBe(-20);
        });

        it("should throw when subtracting different currencies", () => {
            expect(() => Money.pln(10).subtract(Money.eur(5))).toThrow("Currency mismatch");
        });

        it("should multiply by a number", () => {
            const result = Money.pln(10).multiply(3);
            expect(result.amount).toBe(30);
        });

        it("should multiply by a decimal and round", () => {
            const result = Money.pln(10).multiply(0.333);
            expect(result.amount).toBe(3.33);
        });

        it("should multiply by percentage", () => {
            const result = Money.pln(200).multiply(Percentage.of(23));
            expect(result.amount).toBe(46);
            expect(result.currency()).toBe("PLN");
        });

        it("should divide by a number", () => {
            const result = Money.pln(30).divide(3);
            expect(result.amount).toBe(10);
        });

        it("should divide and round", () => {
            const result = Money.pln(10).divide(3);
            expect(result.amount).toBe(3.33);
        });

        it("should throw when dividing by zero", () => {
            expect(() => Money.pln(10).divide(0)).toThrow("Cannot divide by zero");
        });

        it("should divide and return remainder", () => {
            const [quotient, remainder] = Money.pln(10).divideAndRemainder(3);
            expect(quotient.amount).toBe(3);
            expect(remainder.amount).toBe(1);
            expect(quotient.currency()).toBe("PLN");
            expect(remainder.currency()).toBe("PLN");
        });

        it("should negate", () => {
            const result = Money.pln(10).negate();
            expect(result.amount).toBe(-10);
        });

        it("should negate negative to positive", () => {
            const result = Money.pln(10).negate().negate();
            expect(result.amount).toBe(10);
        });

        it("should return absolute value", () => {
            const result = Money.pln(-10).abs();
            expect(result.amount).toBe(10);
        });

        it("should return absolute value of positive", () => {
            const result = Money.pln(10).abs();
            expect(result.amount).toBe(10);
        });
    });

    describe("comparison", () => {

        it("should detect zero", () => {
            expect(Money.zeroPln().isZero()).toBe(true);
            expect(Money.pln(10).isZero()).toBe(false);
        });

        it("should detect negative", () => {
            expect(Money.pln(-10).isNegative()).toBe(true);
            expect(Money.pln(10).isNegative()).toBe(false);
            expect(Money.zeroPln().isNegative()).toBe(false);
        });

        it("should compare greater than", () => {
            expect(Money.pln(20).isGreaterThan(Money.pln(10))).toBe(true);
            expect(Money.pln(10).isGreaterThan(Money.pln(20))).toBe(false);
            expect(Money.pln(10).isGreaterThan(Money.pln(10))).toBe(false);
        });

        it("should compare greater than or equal to", () => {
            expect(Money.pln(20).isGreaterThanOrEqualTo(Money.pln(10))).toBe(true);
            expect(Money.pln(10).isGreaterThanOrEqualTo(Money.pln(10))).toBe(true);
            expect(Money.pln(10).isGreaterThanOrEqualTo(Money.pln(20))).toBe(false);
        });

        it("should throw when comparing different currencies", () => {
            expect(() => Money.pln(10).isGreaterThan(Money.eur(10))).toThrow("Currency mismatch");
        });

        it("should compareTo", () => {
            expect(Money.pln(20).compareTo(Money.pln(10))).toBe(1);
            expect(Money.pln(10).compareTo(Money.pln(20))).toBe(-1);
            expect(Money.pln(10).compareTo(Money.pln(10))).toBe(0);
        });
    });

    describe("equality", () => {

        it("should be equal with same amount and currency", () => {
            expect(Money.pln(10).equals(Money.pln(10))).toBe(true);
        });

        it("should not be equal with different amount", () => {
            expect(Money.pln(10).equals(Money.pln(20))).toBe(false);
        });

        it("should not be equal with different currency", () => {
            expect(Money.pln(10).equals(Money.eur(10))).toBe(false);
        });
    });

    describe("min and max", () => {

        it("should return min", () => {
            const result = Money.min(Money.pln(10), Money.pln(20));
            expect(result.amount).toBe(10);
        });

        it("should return max", () => {
            const result = Money.max(Money.pln(10), Money.pln(20));
            expect(result.amount).toBe(20);
        });

        it("should throw for different currencies in min", () => {
            expect(() => Money.min(Money.pln(10), Money.eur(20))).toThrow("Currency mismatch");
        });

        it("should throw for different currencies in max", () => {
            expect(() => Money.max(Money.pln(10), Money.eur(20))).toThrow("Currency mismatch");
        });
    });

    describe("toString", () => {

        it("should return string representation", () => {
            expect(Money.pln(100).toString()).toBe("PLN 100");
        });

        it("should include decimals", () => {
            expect(Money.pln(10.50).toString()).toBe("PLN 10.5");
        });
    });

    describe("value and currency accessors", () => {

        it("should return value", () => {
            expect(Money.pln(42).value()).toBe(42);
        });

        it("should return currency", () => {
            expect(Money.pln(42).currency()).toBe("PLN");
        });
    });
});
