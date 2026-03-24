/**
 * Context for evaluating applicability constraints.
 */
export class ApplicabilityContext {
    private readonly parameters: Map<string, string>;

    private constructor(parameters: Map<string, string>) {
        this.parameters = new Map(parameters);
    }

    static empty(): ApplicabilityContext {
        return new ApplicabilityContext(new Map());
    }

    static of(parameters: Record<string, string> | Map<string, string> | null): ApplicabilityContext {
        if (parameters == null) return new ApplicabilityContext(new Map());
        if (parameters instanceof Map) return new ApplicabilityContext(parameters);
        return new ApplicabilityContext(new Map(Object.entries(parameters)));
    }

    get(key: string): string | null {
        return this.parameters.get(key) ?? null;
    }

    getOrDefault(key: string, defaultValue: string): string {
        return this.parameters.get(key) ?? defaultValue;
    }

    has(key: string): boolean {
        return this.parameters.has(key);
    }

    asMap(): Map<string, string> {
        return new Map(this.parameters);
    }

    toString(): string {
        return `ApplicabilityContext${JSON.stringify(Object.fromEntries(this.parameters))}`;
    }
}

/**
 * Constraint that can be evaluated against ApplicabilityContext.
 */
export interface ApplicabilityConstraint {
    isSatisfiedBy(context: ApplicabilityContext): boolean;
}

export class AlwaysTrueConstraint implements ApplicabilityConstraint {
    isSatisfiedBy(_context: ApplicabilityContext): boolean {
        return true;
    }
}

export class EqualsConstraint implements ApplicabilityConstraint {
    constructor(readonly parameterName: string, readonly expectedValue: string) {}

    isSatisfiedBy(context: ApplicabilityContext): boolean {
        const value = context.get(this.parameterName);
        return value !== null && value === this.expectedValue;
    }
}

export class InConstraint implements ApplicabilityConstraint {
    readonly allowedValues: Set<string>;
    constructor(readonly parameterName: string, allowedValues: Set<string> | string[]) {
        this.allowedValues = allowedValues instanceof Set ? allowedValues : new Set(allowedValues);
    }

    isSatisfiedBy(context: ApplicabilityContext): boolean {
        const value = context.get(this.parameterName);
        return value !== null && this.allowedValues.has(value);
    }
}

export class GreaterThanConstraint implements ApplicabilityConstraint {
    constructor(readonly parameterName: string, readonly threshold: number) {}

    isSatisfiedBy(context: ApplicabilityContext): boolean {
        const value = context.get(this.parameterName);
        if (value === null) return false;
        const num = parseInt(value, 10);
        return !isNaN(num) && num > this.threshold;
    }
}

export class LessThanConstraint implements ApplicabilityConstraint {
    constructor(readonly parameterName: string, readonly threshold: number) {}

    isSatisfiedBy(context: ApplicabilityContext): boolean {
        const value = context.get(this.parameterName);
        if (value === null) return false;
        const num = parseInt(value, 10);
        return !isNaN(num) && num < this.threshold;
    }
}

export class BetweenConstraint implements ApplicabilityConstraint {
    constructor(readonly parameterName: string, readonly min: number, readonly max: number) {}

    isSatisfiedBy(context: ApplicabilityContext): boolean {
        const value = context.get(this.parameterName);
        if (value === null) return false;
        const num = parseInt(value, 10);
        return !isNaN(num) && num >= this.min && num <= this.max;
    }
}

export class AndConstraint implements ApplicabilityConstraint {
    constructor(readonly constraints: ApplicabilityConstraint[]) {}

    isSatisfiedBy(context: ApplicabilityContext): boolean {
        return this.constraints.every(c => c.isSatisfiedBy(context));
    }
}

export class OrConstraint implements ApplicabilityConstraint {
    constructor(readonly constraints: ApplicabilityConstraint[]) {}

    isSatisfiedBy(context: ApplicabilityContext): boolean {
        return this.constraints.some(c => c.isSatisfiedBy(context));
    }
}

export class NotConstraint implements ApplicabilityConstraint {
    constructor(readonly constraint: ApplicabilityConstraint) {}

    isSatisfiedBy(context: ApplicabilityContext): boolean {
        return !this.constraint.isSatisfiedBy(context);
    }
}

// Factory functions
export const ApplicabilityConstraintFactory = {
    alwaysTrue(): ApplicabilityConstraint {
        return new AlwaysTrueConstraint();
    },
    equalsTo(parameterName: string, expectedValue: string): ApplicabilityConstraint {
        return new EqualsConstraint(parameterName, expectedValue);
    },
    in(parameterName: string, ...allowedValues: string[]): ApplicabilityConstraint {
        return new InConstraint(parameterName, new Set(allowedValues));
    },
    inSet(parameterName: string, allowedValues: Set<string>): ApplicabilityConstraint {
        return new InConstraint(parameterName, allowedValues);
    },
    greaterThan(parameterName: string, threshold: number): ApplicabilityConstraint {
        return new GreaterThanConstraint(parameterName, threshold);
    },
    lessThan(parameterName: string, threshold: number): ApplicabilityConstraint {
        return new LessThanConstraint(parameterName, threshold);
    },
    between(parameterName: string, min: number, max: number): ApplicabilityConstraint {
        return new BetweenConstraint(parameterName, min, max);
    },
    and(...constraints: ApplicabilityConstraint[]): ApplicabilityConstraint {
        return new AndConstraint(constraints);
    },
    or(...constraints: ApplicabilityConstraint[]): ApplicabilityConstraint {
        return new OrConstraint(constraints);
    },
    not(constraint: ApplicabilityConstraint): ApplicabilityConstraint {
        return new NotConstraint(constraint);
    }
};
