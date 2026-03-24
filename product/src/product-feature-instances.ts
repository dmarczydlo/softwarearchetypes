import { Preconditions } from "@softwarearchetypes/common";
import { ProductFeatureInstance } from "./product-feature-instance";
import { ProductFeatureType } from "./product-feature-type";
import { ProductFeatureTypes } from "./product-feature-types";

export class ProductFeatureInstances {

    private readonly features: Map<string, ProductFeatureInstance>;

    constructor(instances: ProductFeatureInstance[]) {
        Preconditions.checkArgument(instances != null, "Feature instances must be defined");
        this.features = new Map();
        for (const inst of instances) {
            this.features.set(inst.featureType().name(), inst);
        }
    }

    static empty(): ProductFeatureInstances {
        return new ProductFeatureInstances([]);
    }

    static of(...instances: ProductFeatureInstance[]): ProductFeatureInstances {
        return new ProductFeatureInstances(instances);
    }

    get(featureNameOrType: string | ProductFeatureType): ProductFeatureInstance | null {
        if (typeof featureNameOrType === "string") {
            return this.features.get(featureNameOrType) ?? null;
        }
        for (const inst of this.features.values()) {
            if (inst.isOfType(featureNameOrType)) return inst;
        }
        return null;
    }

    has(featureNameOrType: string | ProductFeatureType): boolean {
        if (typeof featureNameOrType === "string") {
            return this.features.has(featureNameOrType);
        }
        return this.has(featureNameOrType.name());
    }

    all(): ProductFeatureInstance[] {
        return Array.from(this.features.values());
    }

    size(): number {
        return this.features.size;
    }

    isEmpty(): boolean {
        return this.features.size === 0;
    }

    validateAgainst(featureTypes: ProductFeatureTypes): void {
        const mandatoryFeatures = featureTypes.mandatoryFeatures();
        for (const mandatory of mandatoryFeatures) {
            if (!this.has(mandatory.name())) {
                throw new Error(`Mandatory feature '${mandatory.name()}' is missing`);
            }
        }
        for (const featureName of this.features.keys()) {
            if (!featureTypes.has(featureName)) {
                throw new Error(`Feature '${featureName}' is not defined in ProductType`);
            }
        }
    }

    toString(): string {
        const entries = Array.from(this.features.values())
            .map(f => `${f.featureType().name()}=${f.value()}`)
            .join(", ");
        return `ProductFeatureInstances{${entries}}`;
    }
}
