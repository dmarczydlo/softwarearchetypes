import { Preconditions } from "@softwarearchetypes/common";
import { FeatureValueType } from "./feature-value-type";
import { BaseFeatureValueConstraint } from "./feature-value-constraint";

export class DecimalRangeConstraint extends BaseFeatureValueConstraint {

    private readonly _min: number;
    private readonly _max: number;

    constructor(min: number, max: number) {
        super();
        Preconditions.checkArgument(min != null, "min must be defined");
        Preconditions.checkArgument(max != null, "max must be defined");
        Preconditions.checkArgument(min <= max, "min must be less than or equal to max");
        this._min = min;
        this._max = max;
    }

    static of(min: string, max: string): DecimalRangeConstraint {
        return new DecimalRangeConstraint(parseFloat(min), parseFloat(max));
    }

    static between(min: number, max: number): DecimalRangeConstraint {
        return new DecimalRangeConstraint(min, max);
    }

    valueType(): FeatureValueType {
        return FeatureValueType.DECIMAL;
    }

    type(): string {
        return "DECIMAL_RANGE";
    }

    isValid(value: unknown): boolean {
        if (typeof value !== "number") {
            return false;
        }
        return value >= this._min && value <= this._max;
    }

    desc(): string {
        return `decimal between ${this._min} and ${this._max}`;
    }

    min(): number {
        return this._min;
    }

    max(): number {
        return this._max;
    }
}
