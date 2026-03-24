import { Preconditions } from "@softwarearchetypes/common";
import { FeatureValueType, FeatureValueTypeOps } from "./feature-value-type";
import { BaseFeatureValueConstraint } from "./feature-value-constraint";

export class Unconstrained extends BaseFeatureValueConstraint {

    private readonly _valueType: FeatureValueType;

    constructor(valueType: FeatureValueType) {
        super();
        Preconditions.checkArgument(valueType != null, "Value type must be defined");
        this._valueType = valueType;
    }

    valueType(): FeatureValueType {
        return this._valueType;
    }

    type(): string {
        return "UNCONSTRAINED";
    }

    isValid(value: unknown): boolean {
        return FeatureValueTypeOps.isInstance(this._valueType, value);
    }

    desc(): string {
        return "any " + this._valueType.toLowerCase();
    }
}
