import { Preconditions } from "@softwarearchetypes/common";
import { FeatureValueType } from "./feature-value-type";
import { BaseFeatureValueConstraint } from "./feature-value-constraint";

export class DateRangeConstraint extends BaseFeatureValueConstraint {

    private readonly _from: string;
    private readonly _to: string;

    constructor(from: string, to: string) {
        super();
        Preconditions.checkArgument(from != null, "from date must be defined");
        Preconditions.checkArgument(to != null, "to date must be defined");
        Preconditions.checkArgument(from <= to, "from must be before or equal to to");
        this._from = from;
        this._to = to;
    }

    static between(from: string, to: string): DateRangeConstraint {
        return new DateRangeConstraint(from, to);
    }

    valueType(): FeatureValueType {
        return FeatureValueType.DATE;
    }

    type(): string {
        return "DATE_RANGE";
    }

    isValid(value: unknown): boolean {
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
        }
        return value >= this._from && value <= this._to;
    }

    desc(): string {
        return `date between ${this._from} and ${this._to}`;
    }

    from(): string {
        return this._from;
    }

    to(): string {
        return this._to;
    }
}
