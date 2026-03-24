import { Preconditions } from "@softwarearchetypes/common";
import { ProductFeatureType } from "./product-feature-type";

export class ProductFeatureInstance {

    private readonly _featureType: ProductFeatureType;
    private readonly _value: unknown;

    constructor(featureType: ProductFeatureType, value: unknown) {
        Preconditions.checkArgument(featureType != null, "ProductFeatureType must be defined");
        Preconditions.checkArgument(value != null, "Feature value must be defined");
        featureType.validateValue(value);
        this._featureType = featureType;
        this._value = value;
    }

    static of(featureType: ProductFeatureType, value: unknown): ProductFeatureInstance {
        return new ProductFeatureInstance(featureType, value);
    }

    static fromString(featureType: ProductFeatureType, stringValue: string): ProductFeatureInstance {
        Preconditions.checkArgument(featureType != null, "ProductFeatureType must be defined");
        Preconditions.checkArgument(stringValue != null, "String value must be defined");
        const parsedValue = featureType.constraint().fromString(stringValue);
        return new ProductFeatureInstance(featureType, parsedValue);
    }

    featureType(): ProductFeatureType {
        return this._featureType;
    }

    value(): unknown {
        return this._value;
    }

    valueAsString(): string {
        return this._featureType.constraint().toString(this._value);
    }

    asString(): string {
        if (typeof this._value !== "string") {
            throw new Error(`Feature '${this._featureType.name()}' value is not a string (type: ${typeof this._value})`);
        }
        return this._value;
    }

    asInt(): number {
        if (typeof this._value !== "number" || !Number.isInteger(this._value)) {
            throw new Error(`Feature '${this._featureType.name()}' value is not an integer (type: ${typeof this._value})`);
        }
        return this._value;
    }

    asDecimal(): number {
        if (typeof this._value !== "number") {
            throw new Error(`Feature '${this._featureType.name()}' value is not a decimal (type: ${typeof this._value})`);
        }
        return this._value;
    }

    asDate(): string {
        if (typeof this._value !== "string") {
            throw new Error(`Feature '${this._featureType.name()}' value is not a date (type: ${typeof this._value})`);
        }
        return this._value;
    }

    asBoolean(): boolean {
        if (typeof this._value !== "boolean") {
            throw new Error(`Feature '${this._featureType.name()}' value is not a boolean (type: ${typeof this._value})`);
        }
        return this._value;
    }

    equals(other: ProductFeatureInstance): boolean {
        return this._featureType.equals(other._featureType) && this._value === other._value;
    }

    isOfType(type: ProductFeatureType): boolean {
        return this._featureType.equals(type);
    }

    toString(): string {
        return `ProductFeatureInstance{${this._featureType.name()}=${this._value}}`;
    }
}
