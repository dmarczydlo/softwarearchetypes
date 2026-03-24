import { Preconditions } from "@softwarearchetypes/common";
import { ProductFeatureType } from "./product-feature-type";
import { ProductFeatureTypeDefinition } from "./product-feature-type-definition";

export class ProductFeatureTypes {

    private readonly features: Map<string, ProductFeatureTypeDefinition>;

    constructor(definitions: ProductFeatureTypeDefinition[]) {
        Preconditions.checkArgument(definitions != null, "Feature definitions must be defined");
        this.features = new Map();
        for (const def of definitions) {
            this.features.set(def.featureType().name(), def);
        }
    }

    static empty(): ProductFeatureTypes {
        return new ProductFeatureTypes([]);
    }

    static of(...definitions: ProductFeatureTypeDefinition[]): ProductFeatureTypes {
        return new ProductFeatureTypes(definitions);
    }

    get(featureName: string): ProductFeatureTypeDefinition | null {
        return this.features.get(featureName) ?? null;
    }

    getFeatureType(featureName: string): ProductFeatureType | null {
        const def = this.features.get(featureName);
        return def ? def.featureType() : null;
    }

    has(featureName: string): boolean {
        return this.features.has(featureName);
    }

    isMandatory(featureName: string): boolean {
        const def = this.features.get(featureName);
        return def ? def.isMandatory() : false;
    }

    mandatoryFeatures(): Set<ProductFeatureType> {
        const result = new Set<ProductFeatureType>();
        for (const def of this.features.values()) {
            if (def.isMandatory()) result.add(def.featureType());
        }
        return result;
    }

    optionalFeatures(): Set<ProductFeatureType> {
        const result = new Set<ProductFeatureType>();
        for (const def of this.features.values()) {
            if (def.isOptional()) result.add(def.featureType());
        }
        return result;
    }

    allFeatures(): Set<ProductFeatureType> {
        const result = new Set<ProductFeatureType>();
        for (const def of this.features.values()) {
            result.add(def.featureType());
        }
        return result;
    }

    size(): number {
        return this.features.size;
    }

    isEmpty(): boolean {
        return this.features.size === 0;
    }

    toString(): string {
        return `ProductFeatureTypes{mandatory=${this.mandatoryFeatures().size}, optional=${this.optionalFeatures().size}}`;
    }
}
