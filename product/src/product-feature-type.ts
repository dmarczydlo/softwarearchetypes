import { Preconditions } from "@softwarearchetypes/common";
import { FeatureValueConstraint } from "./feature-value-constraint";
import { FeatureValueType, FeatureValueTypeOps } from "./feature-value-type";
import { AllowedValuesConstraint } from "./allowed-values-constraint";
import { NumericRangeConstraint } from "./numeric-range-constraint";
import { DecimalRangeConstraint } from "./decimal-range-constraint";
import { RegexConstraint } from "./regex-constraint";
import { DateRangeConstraint } from "./date-range-constraint";
import { Unconstrained } from "./unconstrained";

export class ProductFeatureType {

    private readonly _name: string;
    private readonly _constraint: FeatureValueConstraint;

    constructor(name: string, constraint: FeatureValueConstraint) {
        Preconditions.checkArgument(name != null && name.trim().length > 0, "Feature type name must be defined");
        Preconditions.checkArgument(constraint != null, "Constraint must be defined");
        this._name = name;
        this._constraint = constraint;
    }

    static withAllowedValues(name: string, ...allowedValues: string[]): ProductFeatureType {
        return new ProductFeatureType(name, AllowedValuesConstraint.of(...allowedValues));
    }

    static withNumericRange(name: string, min: number, max: number): ProductFeatureType {
        return new ProductFeatureType(name, new NumericRangeConstraint(min, max));
    }

    static withDecimalRange(name: string, min: string, max: string): ProductFeatureType {
        return new ProductFeatureType(name, DecimalRangeConstraint.of(min, max));
    }

    static withRegex(name: string, pattern: string): ProductFeatureType {
        return new ProductFeatureType(name, new RegexConstraint(pattern));
    }

    static withDateRange(name: string, from: string, to: string): ProductFeatureType {
        return new ProductFeatureType(name, DateRangeConstraint.between(from, to));
    }

    static unconstrained(name: string, valueType: FeatureValueType): ProductFeatureType {
        return new ProductFeatureType(name, new Unconstrained(valueType));
    }

    static of(name: string, constraint: FeatureValueConstraint): ProductFeatureType {
        return new ProductFeatureType(name, constraint);
    }

    name(): string {
        return this._name;
    }

    constraint(): FeatureValueConstraint {
        return this._constraint;
    }

    isValidValue(value: unknown): boolean {
        return this._constraint.isValid(value);
    }

    validateValue(value: unknown): void {
        Preconditions.checkArgument(value != null, "Feature value must not be null");
        Preconditions.checkArgument(FeatureValueTypeOps.isInstance(this._constraint.valueType(), value),
            `Feature '${this._name}' expects type ${FeatureValueTypeOps.typeName(this._constraint.valueType())} but got ${typeof value}`);
        Preconditions.checkArgument(this.isValidValue(value),
            `Invalid value '${value}' for feature '${this._name}'. Expected: ${this._constraint.desc()}`);
    }

    equals(other: ProductFeatureType): boolean {
        return this._name === other._name;
    }

    toString(): string {
        return `ProductFeatureType{name='${this._name}', constraint=${this._constraint.desc()}}`;
    }
}
