import { Unit } from "@softwarearchetypes/quantity";
import { ProductIdentifier } from "./product-identifier";
import { ProductName } from "./product-name";
import { ProductDescription } from "./product-description";
import { ProductMetadata } from "./product-metadata";
import { ProductTrackingStrategy } from "./product-tracking-strategy";
import { ProductFeatureType } from "./product-feature-type";
import { ProductFeatureTypeDefinition } from "./product-feature-type-definition";
import { ProductFeatureTypes } from "./product-feature-types";
import { ApplicabilityConstraint, ApplicabilityConstraintFactory } from "./applicability";
import { ProductType } from "./product-type";
import { PackageType } from "./package-type";
import { PackageStructure } from "./package-structure";
import { ProductSet } from "./product-set";
import { SelectionRule, IsSubsetOf } from "./selection-rule";

export class ProductBuilder {
    private readonly _id: ProductIdentifier;
    private readonly _name: ProductName;
    private readonly _description: ProductDescription;
    private _metadata: ProductMetadata = ProductMetadata.empty();
    private _applicabilityConstraint: ApplicabilityConstraint = ApplicabilityConstraintFactory.alwaysTrue();

    constructor(id: ProductIdentifier, name: ProductName, description: ProductDescription) {
        this._id = id;
        this._name = name;
        this._description = description;
    }

    withMetadata(metadataOrKey: ProductMetadata | string, value?: string): ProductBuilder {
        if (typeof metadataOrKey === "string") {
            this._metadata = this._metadata.with(metadataOrKey, value!);
        } else {
            this._metadata = metadataOrKey;
        }
        return this;
    }

    withApplicabilityConstraint(constraint: ApplicabilityConstraint): ProductBuilder {
        this._applicabilityConstraint = constraint;
        return this;
    }

    asProductType(preferredUnit: Unit, trackingStrategy: ProductTrackingStrategy): ProductTypeBuilder {
        return new ProductTypeBuilder(this, preferredUnit, trackingStrategy);
    }

    asPackageType(): PackageTypeBuilder {
        return new PackageTypeBuilder(this);
    }

    // Expose internal state for sub-builders
    get id() { return this._id; }
    get nameVal() { return this._name; }
    get descriptionVal() { return this._description; }
    get metadataVal() { return this._metadata; }
    get applicabilityConstraintVal() { return this._applicabilityConstraint; }
    set metadataVal(val: ProductMetadata) { this._metadata = val; }
    set applicabilityConstraintVal(val: ApplicabilityConstraint) { this._applicabilityConstraint = val; }
}

export class ProductTypeBuilder {
    private readonly _parent: ProductBuilder;
    private readonly _preferredUnit: Unit;
    private readonly _trackingStrategy: ProductTrackingStrategy;
    private readonly _featureDefinitions: ProductFeatureTypeDefinition[] = [];

    constructor(parent: ProductBuilder, preferredUnit: Unit, trackingStrategy: ProductTrackingStrategy) {
        this._parent = parent;
        this._preferredUnit = preferredUnit;
        this._trackingStrategy = trackingStrategy;
    }

    withMandatoryFeature(featureType: ProductFeatureType): ProductTypeBuilder {
        this._featureDefinitions.push(ProductFeatureTypeDefinition.mandatory(featureType));
        return this;
    }

    withOptionalFeature(featureType: ProductFeatureType): ProductTypeBuilder {
        this._featureDefinitions.push(ProductFeatureTypeDefinition.optional(featureType));
        return this;
    }

    withFeature(definition: ProductFeatureTypeDefinition): ProductTypeBuilder {
        this._featureDefinitions.push(definition);
        return this;
    }

    withApplicabilityConstraint(constraint: ApplicabilityConstraint): ProductTypeBuilder {
        this._parent.applicabilityConstraintVal = constraint;
        return this;
    }

    withMetadata(metadataOrKey: ProductMetadata | string, value?: string): ProductTypeBuilder {
        if (typeof metadataOrKey === "string") {
            this._parent.metadataVal = this._parent.metadataVal.with(metadataOrKey, value!);
        } else {
            this._parent.metadataVal = metadataOrKey;
        }
        return this;
    }

    build(): ProductType {
        const features = new ProductFeatureTypes(this._featureDefinitions);
        return new ProductType(
            this._parent.id,
            this._parent.nameVal,
            this._parent.descriptionVal,
            this._preferredUnit,
            this._trackingStrategy,
            features,
            this._parent.metadataVal,
            this._parent.applicabilityConstraintVal,
        );
    }
}

export class PackageTypeBuilder {
    private readonly _parent: ProductBuilder;
    private readonly _productSets: Map<string, ProductSet> = new Map();
    private readonly _selectionRules: SelectionRule[] = [];
    private _trackingStrategy: ProductTrackingStrategy = ProductTrackingStrategy.INDIVIDUALLY_TRACKED;

    constructor(parent: ProductBuilder) {
        this._parent = parent;
    }

    withTrackingStrategy(trackingStrategy: ProductTrackingStrategy): PackageTypeBuilder {
        this._trackingStrategy = trackingStrategy;
        return this;
    }

    withSingleChoice(setName: string, ...productIds: ProductIdentifier[]): PackageTypeBuilder {
        return this.withChoice(setName, 1, 1, ...productIds);
    }

    withOptionalChoice(setName: string, ...productIds: ProductIdentifier[]): PackageTypeBuilder {
        return this.withChoice(setName, 0, 1, ...productIds);
    }

    withRequiredChoice(setName: string, ...productIds: ProductIdentifier[]): PackageTypeBuilder {
        return this.withChoice(setName, 1, Number.MAX_SAFE_INTEGER, ...productIds);
    }

    withChoice(setName: string, min: number, max: number, ...productIds: ProductIdentifier[]): PackageTypeBuilder {
        const set = new ProductSet(setName, new Set(productIds));
        this._productSets.set(setName, set);
        this._selectionRules.push(new IsSubsetOf(set, min, max));
        return this;
    }

    withProductSet(setOrName: ProductSet | string, ...productIds: ProductIdentifier[]): PackageTypeBuilder {
        if (typeof setOrName === "string") {
            const set = ProductSet.of(setOrName, ...productIds);
            this._productSets.set(setOrName, set);
        } else {
            this._productSets.set(setOrName.name(), setOrName);
        }
        return this;
    }

    withProductSets(...productSets: ProductSet[]): PackageTypeBuilder {
        for (const set of productSets) {
            this._productSets.set(set.name(), set);
        }
        return this;
    }

    withRule(rule: SelectionRule): PackageTypeBuilder {
        this._selectionRules.push(rule);
        return this;
    }

    getProductSet(setName: string): ProductSet | undefined {
        return this._productSets.get(setName);
    }

    withApplicabilityConstraint(constraint: ApplicabilityConstraint): PackageTypeBuilder {
        this._parent.applicabilityConstraintVal = constraint;
        return this;
    }

    withMetadata(metadataOrKey: ProductMetadata | string, value?: string): PackageTypeBuilder {
        if (typeof metadataOrKey === "string") {
            this._parent.metadataVal = this._parent.metadataVal.with(metadataOrKey, value!);
        } else {
            this._parent.metadataVal = metadataOrKey;
        }
        return this;
    }

    build(): PackageType {
        const structure = new PackageStructure(this._productSets, this._selectionRules);
        return new PackageType(
            this._parent.id,
            this._parent.nameVal,
            this._parent.descriptionVal,
            this._trackingStrategy,
            this._parent.metadataVal,
            this._parent.applicabilityConstraintVal,
            structure,
        );
    }
}
