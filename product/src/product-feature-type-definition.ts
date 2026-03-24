import { Preconditions } from "@softwarearchetypes/common";
import { ProductFeatureType } from "./product-feature-type";

export class ProductFeatureTypeDefinition {

    private readonly _featureType: ProductFeatureType;
    private readonly _mandatory: boolean;

    constructor(featureType: ProductFeatureType, mandatory: boolean) {
        Preconditions.checkArgument(featureType != null, "ProductFeatureType must be defined");
        this._featureType = featureType;
        this._mandatory = mandatory;
    }

    static mandatory(featureType: ProductFeatureType): ProductFeatureTypeDefinition {
        return new ProductFeatureTypeDefinition(featureType, true);
    }

    static optional(featureType: ProductFeatureType): ProductFeatureTypeDefinition {
        return new ProductFeatureTypeDefinition(featureType, false);
    }

    featureType(): ProductFeatureType {
        return this._featureType;
    }

    isMandatory(): boolean {
        return this._mandatory;
    }

    isOptional(): boolean {
        return !this._mandatory;
    }

    toString(): string {
        return `${this._mandatory ? "mandatory" : "optional"}(${this._featureType.name()})`;
    }
}
