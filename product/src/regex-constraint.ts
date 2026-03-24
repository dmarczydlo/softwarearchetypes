import { Preconditions } from "@softwarearchetypes/common";
import { FeatureValueType } from "./feature-value-type";
import { BaseFeatureValueConstraint } from "./feature-value-constraint";

export class RegexConstraint extends BaseFeatureValueConstraint {

    private readonly _pattern: RegExp;
    private readonly _patternString: string;

    constructor(pattern: string) {
        super();
        Preconditions.checkArgument(pattern != null && pattern.trim().length > 0, "Pattern must be defined");
        this._patternString = pattern;
        this._pattern = new RegExp(pattern);
    }

    static of(pattern: string): RegexConstraint {
        return new RegexConstraint(pattern);
    }

    valueType(): FeatureValueType {
        return FeatureValueType.TEXT;
    }

    type(): string {
        return "REGEX";
    }

    isValid(value: unknown): boolean {
        if (typeof value !== "string") {
            return false;
        }
        return this._pattern.test(value);
    }

    desc(): string {
        return "text matching pattern: " + this._patternString;
    }

    pattern(): string {
        return this._patternString;
    }
}
