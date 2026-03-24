import { Preconditions } from "@softwarearchetypes/common";
import { FeatureValueType } from "./feature-value-type";
import { BaseFeatureValueConstraint } from "./feature-value-constraint";

export class NumericRangeConstraint extends BaseFeatureValueConstraint {

    private readonly _min: number;
    private readonly _max: number;

    constructor(min: number, max: number) {
        super();
        Preconditions.checkArgument(min <= max, "min must be less than or equal to max");
        this._min = min;
        this._max = max;
    }

    static between(min: number, max: number): NumericRangeConstraint {
        return new NumericRangeConstraint(min, max);
    }

    valueType(): FeatureValueType {
        return FeatureValueType.INTEGER;
    }

    type(): string {
        return "NUMERIC_RANGE";
    }

    isValid(value: unknown): boolean {
        if (typeof value !== "number" || !Number.isInteger(value)) {
            return false;
        }
        return value >= this._min && value <= this._max;
    }

    desc(): string {
        return `integer between ${this._min} and ${this._max}`;
    }

    min(): number {
        return this._min;
    }

    max(): number {
        return this._max;
    }
}
