import { Preconditions } from "@softwarearchetypes/common";
import { Percentage } from "./percentage";

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

export class Money {

    readonly amount: number;
    readonly currencyCode: string;

    private constructor(amount: number, currencyCode: string) {
        Preconditions.checkArgument(currencyCode != null && currencyCode.trim().length > 0, "Currency code cannot be null or blank");
        this.amount = round2(amount);
        this.currencyCode = currencyCode;
    }

    static of(amount: number, currencyCode: string): Money {
        return new Money(amount, currencyCode);
    }

    static pln(amount: number): Money {
        return new Money(amount, "PLN");
    }

    static eur(amount: number): Money {
        return new Money(amount, "EUR");
    }

    static gbp(amount: number): Money {
        return new Money(amount, "GBP");
    }

    static usd(amount: number): Money {
        return new Money(amount, "USD");
    }

    static onePln(): Money {
        return Money.of(1, "PLN");
    }

    static zeroPln(): Money {
        return Money.pln(0);
    }

    static zeroEur(): Money {
        return Money.eur(0);
    }

    static zeroGbp(): Money {
        return Money.gbp(0);
    }

    static zeroUsd(): Money {
        return Money.usd(0);
    }

    add(other: Money): Money {
        this.checkSameCurrency(other);
        return new Money(this.amount + other.amount, this.currencyCode);
    }

    subtract(other: Money): Money {
        this.checkSameCurrency(other);
        return new Money(this.amount - other.amount, this.currencyCode);
    }

    multiply(factor: number | Percentage): Money {
        if (factor instanceof Percentage) {
            return new Money(this.amount * factor.value / 100, this.currencyCode);
        }
        return new Money(this.amount * factor, this.currencyCode);
    }

    divide(divisor: number): Money {
        Preconditions.checkArgument(divisor !== 0, "Cannot divide by zero");
        return new Money(this.amount / divisor, this.currencyCode);
    }

    divideAndRemainder(divisor: number): [Money, Money] {
        Preconditions.checkArgument(divisor !== 0, "Cannot divide by zero");
        const quotient = Math.floor(this.amount / divisor);
        const remainder = round2(this.amount - quotient * divisor);
        return [new Money(quotient, this.currencyCode), new Money(remainder, this.currencyCode)];
    }

    negate(): Money {
        return new Money(-this.amount, this.currencyCode);
    }

    abs(): Money {
        return new Money(Math.abs(this.amount), this.currencyCode);
    }

    isZero(): boolean {
        return this.amount === 0;
    }

    isNegative(): boolean {
        return this.amount < 0;
    }

    isGreaterThan(other: Money): boolean {
        this.checkSameCurrency(other);
        return this.amount > other.amount;
    }

    isGreaterThanOrEqualTo(other: Money): boolean {
        this.checkSameCurrency(other);
        return this.amount >= other.amount;
    }

    value(): number {
        return this.amount;
    }

    currency(): string {
        return this.currencyCode;
    }

    compareTo(other: Money): number {
        this.checkSameCurrency(other);
        if (this.amount < other.amount) return -1;
        if (this.amount > other.amount) return 1;
        return 0;
    }

    equals(other: Money): boolean {
        return this.amount === other.amount && this.currencyCode === other.currencyCode;
    }

    currencyUnit(): string {
        return this.currencyCode;
    }

    toString(): string {
        return `${this.currencyCode} ${this.amount}`;
    }

    static absOf(money: Money): Money {
        return money.abs();
    }

    static min(a: Money, b: Money): Money;
    static min(moneys: Money[]): Money | null;
    static min(aOrMoneys: Money | Money[], b?: Money): Money | null {
        if (Array.isArray(aOrMoneys)) {
            if (aOrMoneys.length === 0) return null;
            return aOrMoneys.reduce((min, m) => Money.min(min, m));
        }
        const a = aOrMoneys;
        a.checkSameCurrency(b!);
        return a.amount <= b!.amount ? a : b!;
    }

    static max(a: Money, b: Money): Money {
        a.checkSameCurrency(b);
        return a.amount >= b.amount ? a : b;
    }

    private checkSameCurrency(other: Money): void {
        Preconditions.checkArgument(
            this.currencyCode === other.currencyCode,
            `Currency mismatch: ${this.currencyCode} and ${other.currencyCode}`
        );
    }
}
