import { Preconditions } from "@softwarearchetypes/common";
import { FeatureValueType } from "./feature-value-type";
import { BaseFeatureValueConstraint } from "./feature-value-constraint";

export class AllowedValuesConstraint extends BaseFeatureValueConstraint {

    private readonly _allowedValues: Set<string>;

    constructor(allowedValues: Set<string>) {
        super();
        Preconditions.checkArgument(allowedValues != null && allowedValues.size > 0,
            "Allowed values must not be empty");
        this._allowedValues = new Set(allowedValues);
    }

    static of(...values: string[]): AllowedValuesConstraint {
        Preconditions.checkArgument(values != null && values.length > 0,
            "Allowed values must not be empty");
        return new AllowedValuesConstraint(new Set(values));
    }

    valueType(): FeatureValueType {
        return FeatureValueType.TEXT;
    }

    type(): string {
        return "ALLOWED_VALUES";
    }

    isValid(value: unknown): boolean {
        return typeof value === "string" && this._allowedValues.has(value);
    }

    desc(): string {
        return "one of: {" + Array.from(this._allowedValues).join(", ") + "}";
    }

    allowedValues(): Set<string> {
        return this._allowedValues;
    }
}
