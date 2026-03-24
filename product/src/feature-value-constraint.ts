import { FeatureValueType, FeatureValueTypeOps } from "./feature-value-type";

/**
 * Defines constraints on product feature values, including type validation and value validation.
 */
export interface FeatureValueConstraint {
    valueType(): FeatureValueType;
    type(): string;
    isValid(value: unknown): boolean;
    desc(): string;

    toString(value: unknown): string;
    fromString(value: string): unknown;
}

export abstract class BaseFeatureValueConstraint implements FeatureValueConstraint {
    abstract valueType(): FeatureValueType;
    abstract type(): string;
    abstract isValid(value: unknown): boolean;
    abstract desc(): string;

    toString(value: unknown): string {
        return FeatureValueTypeOps.castTo(this.valueType(), value);
    }

    fromString(value: string): unknown {
        const casted = FeatureValueTypeOps.castFrom(this.valueType(), value);
        if (!this.isValid(casted)) {
            throw new Error(`Invalid value: '${value}'. Expected: ${this.desc()}`);
        }
        return casted;
    }
}
