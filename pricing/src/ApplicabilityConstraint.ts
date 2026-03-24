import { PricingContext } from "./PricingContext.js";

export interface ApplicabilityConstraint {
    isSatisfiedBy(context: PricingContext): boolean;
}

export function alwaysTrue(): ApplicabilityConstraint {
    return new AlwaysTrueConstraint();
}

export function equalsTo(parameterName: string, expectedValue: string): ApplicabilityConstraint {
    return new EqualsConstraint(parameterName, expectedValue);
}

export function inValues(parameterName: string, ...allowedValues: string[]): ApplicabilityConstraint {
    return new InConstraint(parameterName, new Set(allowedValues));
}

export function inSet(parameterName: string, allowedValues: Set<string>): ApplicabilityConstraint {
    return new InConstraint(parameterName, allowedValues);
}

export function greaterThan(parameterName: string, threshold: number): ApplicabilityConstraint {
    return new GreaterThanConstraint(parameterName, threshold);
}

export function greaterThanOrEqualTo(parameterName: string, threshold: number): ApplicabilityConstraint {
    return new GreaterThanOrEqualConstraint(parameterName, threshold);
}

export function lessThan(parameterName: string, threshold: number): ApplicabilityConstraint {
    return new LessThanConstraint(parameterName, threshold);
}

export function lessThanOrEqualTo(parameterName: string, threshold: number): ApplicabilityConstraint {
    return new LessThanOrEqualConstraint(parameterName, threshold);
}

export function between(parameterName: string, min: number, max: number): ApplicabilityConstraint {
    return new BetweenConstraint(parameterName, min, max);
}

export function and(...constraints: ApplicabilityConstraint[]): ApplicabilityConstraint {
    return new AndConstraint(constraints);
}

export function or(...constraints: ApplicabilityConstraint[]): ApplicabilityConstraint {
    return new OrConstraint(constraints);
}

export function not(constraint: ApplicabilityConstraint): ApplicabilityConstraint {
    return new NotConstraint(constraint);
}

// ---- Constraint implementations ----

class AlwaysTrueConstraint implements ApplicabilityConstraint {
    isSatisfiedBy(_context: PricingContext): boolean {
        return true;
    }
}

class EqualsConstraint implements ApplicabilityConstraint {
    constructor(private readonly parameterName: string, private readonly expectedValue: string) {}
    isSatisfiedBy(context: PricingContext): boolean {
        const value = context.get(this.parameterName);
        return value !== null && value === this.expectedValue;
    }
}

class InConstraint implements ApplicabilityConstraint {
    constructor(private readonly parameterName: string, private readonly allowedValues: Set<string>) {}
    isSatisfiedBy(context: PricingContext): boolean {
        const value = context.get(this.parameterName);
        return value !== null && this.allowedValues.has(value);
    }
}

class GreaterThanConstraint implements ApplicabilityConstraint {
    constructor(private readonly parameterName: string, private readonly threshold: number) {}
    isSatisfiedBy(context: PricingContext): boolean {
        const value = context.get(this.parameterName);
        if (value === null) return false;
        const num = Number(value);
        return !isNaN(num) && num > this.threshold;
    }
}

class GreaterThanOrEqualConstraint implements ApplicabilityConstraint {
    constructor(private readonly parameterName: string, private readonly threshold: number) {}
    isSatisfiedBy(context: PricingContext): boolean {
        const value = context.get(this.parameterName);
        if (value === null) return false;
        const num = Number(value);
        return !isNaN(num) && num >= this.threshold;
    }
}

class LessThanConstraint implements ApplicabilityConstraint {
    constructor(private readonly parameterName: string, private readonly threshold: number) {}
    isSatisfiedBy(context: PricingContext): boolean {
        const value = context.get(this.parameterName);
        if (value === null) return false;
        const num = Number(value);
        return !isNaN(num) && num < this.threshold;
    }
}

class LessThanOrEqualConstraint implements ApplicabilityConstraint {
    constructor(private readonly parameterName: string, private readonly threshold: number) {}
    isSatisfiedBy(context: PricingContext): boolean {
        const value = context.get(this.parameterName);
        if (value === null) return false;
        const num = Number(value);
        return !isNaN(num) && num <= this.threshold;
    }
}

class BetweenConstraint implements ApplicabilityConstraint {
    constructor(private readonly parameterName: string, private readonly min: number, private readonly max: number) {}
    isSatisfiedBy(context: PricingContext): boolean {
        const value = context.get(this.parameterName);
        if (value === null) return false;
        const num = Number(value);
        return !isNaN(num) && num >= this.min && num <= this.max;
    }
}

class AndConstraint implements ApplicabilityConstraint {
    constructor(private readonly constraints: ApplicabilityConstraint[]) {}
    isSatisfiedBy(context: PricingContext): boolean {
        return this.constraints.every(c => c.isSatisfiedBy(context));
    }
}

class OrConstraint implements ApplicabilityConstraint {
    constructor(private readonly constraints: ApplicabilityConstraint[]) {}
    isSatisfiedBy(context: PricingContext): boolean {
        return this.constraints.some(c => c.isSatisfiedBy(context));
    }
}

class NotConstraint implements ApplicabilityConstraint {
    constructor(private readonly constraint: ApplicabilityConstraint) {}
    isSatisfiedBy(context: PricingContext): boolean {
        return !this.constraint.isSatisfiedBy(context);
    }
}
