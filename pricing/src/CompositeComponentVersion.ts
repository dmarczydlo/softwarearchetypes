import type { Component } from "./Component.js";
import { ComponentId } from "./ComponentId.js";
import { ParameterValue } from "./ParameterValue.js";
import { ApplicabilityConstraint, alwaysTrue } from "./ApplicabilityConstraint.js";
import { PricingContext } from "./PricingContext.js";
import { Validity } from "./Validity.js";
import { ComponentVersion } from "./VersionUpdateStrategy.js";

export class CompositeComponentVersion implements ComponentVersion {
    readonly children: Component[];
    readonly dependencies: Map<string, Map<string, ParameterValue>>; // componentId -> paramName -> expression
    readonly applicabilityConstraint: ApplicabilityConstraint;
    private readonly _validity: Validity;
    private readonly _definedAt: Date;

    constructor(
        children: Component[],
        dependencies: Map<string, Map<string, ParameterValue>>,
        applicabilityConstraintOrValidity: ApplicabilityConstraint | Validity,
        validityOrDefinedAt: Validity | Date,
        definedAt5?: Date
    ) {
        this.children = [...children];

        // Deep copy dependencies
        this.dependencies = new Map();
        for (const [key, innerMap] of dependencies) {
            this.dependencies.set(key, new Map(innerMap));
        }

        if (definedAt5 !== undefined) {
            // 5-arg: children, deps, constraint, validity, definedAt
            this.applicabilityConstraint = applicabilityConstraintOrValidity as ApplicabilityConstraint;
            this._validity = validityOrDefinedAt as Validity;
            this._definedAt = definedAt5;
        } else {
            // 4-arg: children, deps, validity, definedAt
            this.applicabilityConstraint = alwaysTrue();
            this._validity = applicabilityConstraintOrValidity as Validity;
            this._definedAt = validityOrDefinedAt as Date;
        }
    }

    validity(): Validity {
        return this._validity;
    }

    definedAt(): Date {
        return this._definedAt;
    }

    isApplicableFor(context: PricingContext): boolean {
        return this._validity.isValidAt(context.timestamp()) &&
               this.applicabilityConstraint.isSatisfiedBy(context);
    }

    static of(
        children: Component[],
        dependencies: Map<string, Map<string, ParameterValue>>,
        applicabilityConstraintOrValidity: ApplicabilityConstraint | Validity,
        validityOrNow: Validity | Date,
        now5?: Date
    ): CompositeComponentVersion {
        if (now5 !== undefined) {
            return new CompositeComponentVersion(
                children, dependencies,
                applicabilityConstraintOrValidity as ApplicabilityConstraint,
                validityOrNow as Validity,
                now5
            );
        }
        if (validityOrNow instanceof Date) {
            return new CompositeComponentVersion(
                children, dependencies,
                applicabilityConstraintOrValidity as Validity,
                validityOrNow
            );
        }
        throw new Error("Invalid CompositeComponentVersion.of arguments");
    }

    static ofSimple(children: Component[], validity: Validity, now: Date): CompositeComponentVersion {
        return new CompositeComponentVersion(children, new Map(), validity, now);
    }

    static ofWithChildren(validity: Validity, now: Date, ...children: Component[]): CompositeComponentVersion {
        return new CompositeComponentVersion(children, new Map(), validity, now);
    }
}
