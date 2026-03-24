import { Calculator } from "./Calculator.js";
import { ApplicabilityConstraint, alwaysTrue } from "./ApplicabilityConstraint.js";
import { PricingContext } from "./PricingContext.js";
import { Validity } from "./Validity.js";
import { ComponentVersion } from "./VersionUpdateStrategy.js";

export class SimpleComponentVersion implements ComponentVersion {
    readonly calculator: Calculator;
    readonly parameterMappings: Map<string, string>;
    readonly applicabilityConstraint: ApplicabilityConstraint;
    private readonly _validity: Validity;
    private readonly _definedAt: Date;

    constructor(
        calculator: Calculator,
        parameterMappings: Map<string, string> | Record<string, string>,
        applicabilityConstraintOrValidity: ApplicabilityConstraint | Validity,
        validityOrDefinedAt: Validity | Date,
        definedAt5?: Date
    ) {
        this.calculator = calculator;

        if (parameterMappings instanceof Map) {
            this.parameterMappings = new Map(parameterMappings);
        } else {
            this.parameterMappings = new Map(Object.entries(parameterMappings));
        }

        if (definedAt5 !== undefined) {
            // 5-arg: calculator, mappings, constraint, validity, definedAt
            this.applicabilityConstraint = applicabilityConstraintOrValidity as ApplicabilityConstraint;
            this._validity = validityOrDefinedAt as Validity;
            this._definedAt = definedAt5;
        } else {
            // 4-arg: calculator, mappings, validity, definedAt
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
        calculator: Calculator,
        parameterMappings: Map<string, string> | Record<string, string>,
        applicabilityConstraintOrValidity: ApplicabilityConstraint | Validity,
        validityOrClock: Validity | Date,
        clock5?: Date
    ): SimpleComponentVersion {
        if (clock5 !== undefined) {
            // 5-arg: calculator, mappings, constraint, validity, clock(now)
            return new SimpleComponentVersion(
                calculator, parameterMappings,
                applicabilityConstraintOrValidity as ApplicabilityConstraint,
                validityOrClock as Validity,
                clock5
            );
        }
        if (validityOrClock instanceof Date) {
            // 4-arg: calculator, mappings, validity, clock(now)
            return new SimpleComponentVersion(
                calculator, parameterMappings,
                applicabilityConstraintOrValidity as Validity,
                validityOrClock
            );
        }
        // Should not happen
        throw new Error("Invalid SimpleComponentVersion.of arguments");
    }

    static ofSimple(calculator: Calculator, validity: Validity, now: Date): SimpleComponentVersion {
        return new SimpleComponentVersion(calculator, {}, validity, now);
    }
}
