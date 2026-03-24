import { Preconditions } from "@softwarearchetypes/common";
import { Unit } from "@softwarearchetypes/quantity";
import { Product } from "./product";
import { ProductIdentifier } from "./product-identifier";
import { ProductName } from "./product-name";
import { ProductDescription } from "./product-description";
import { ProductMetadata } from "./product-metadata";
import { ProductTrackingStrategy } from "./product-tracking-strategy";
import { ProductFeatureTypes } from "./product-feature-types";
import { ApplicabilityConstraint, ApplicabilityConstraintFactory, ApplicabilityContext } from "./applicability";
import { ProductBuilder } from "./product-builder";

export class ProductType implements Product {

    private readonly _id: ProductIdentifier;
    private readonly _name: ProductName;
    private readonly _description: ProductDescription;
    readonly preferredUnit: Unit;
    private readonly _trackingStrategy: ProductTrackingStrategy;
    private readonly _featureTypes: ProductFeatureTypes;
    private readonly _metadata: ProductMetadata;
    private readonly _applicabilityConstraint: ApplicabilityConstraint;

    constructor(
        id: ProductIdentifier,
        name: ProductName,
        description: ProductDescription,
        preferredUnit: Unit,
        trackingStrategy: ProductTrackingStrategy,
        featureTypes: ProductFeatureTypes,
        metadata: ProductMetadata,
        applicabilityConstraint: ApplicabilityConstraint,
    ) {
        Preconditions.checkArgument(id != null, "ProductIdentifier must be defined");
        Preconditions.checkArgument(name != null, "ProductName must be defined");
        Preconditions.checkArgument(description != null, "ProductDescription must be defined");
        Preconditions.checkArgument(preferredUnit != null, "Unit must be defined");
        Preconditions.checkArgument(trackingStrategy != null, "ProductTrackingStrategy must be defined");
        Preconditions.checkArgument(featureTypes != null, "ProductFeatureTypes must be defined");
        Preconditions.checkArgument(metadata != null, "ProductMetadata must be defined");
        Preconditions.checkArgument(applicabilityConstraint != null, "ApplicabilityConstraint must be defined");
        this._id = id;
        this._name = name;
        this._description = description;
        this.preferredUnit = preferredUnit;
        this._trackingStrategy = trackingStrategy;
        this._featureTypes = featureTypes;
        this._metadata = metadata;
        this._applicabilityConstraint = applicabilityConstraint;
    }

    static define(id: ProductIdentifier, name: ProductName, description: ProductDescription): ProductType {
        return new ProductType(id, name, description, Unit.pieces(), ProductTrackingStrategy.IDENTICAL,
            ProductFeatureTypes.empty(), ProductMetadata.empty(), ApplicabilityConstraintFactory.alwaysTrue());
    }

    static unique(id: ProductIdentifier, name: ProductName, description: ProductDescription): ProductType {
        return new ProductType(id, name, description, Unit.pieces(), ProductTrackingStrategy.UNIQUE,
            ProductFeatureTypes.empty(), ProductMetadata.empty(), ApplicabilityConstraintFactory.alwaysTrue());
    }

    static individuallyTracked(id: ProductIdentifier, name: ProductName, description: ProductDescription, preferredUnit: Unit): ProductType {
        return new ProductType(id, name, description, preferredUnit, ProductTrackingStrategy.INDIVIDUALLY_TRACKED,
            ProductFeatureTypes.empty(), ProductMetadata.empty(), ApplicabilityConstraintFactory.alwaysTrue());
    }

    static batchTracked(id: ProductIdentifier, name: ProductName, description: ProductDescription, preferredUnit: Unit): ProductType {
        return new ProductType(id, name, description, preferredUnit, ProductTrackingStrategy.BATCH_TRACKED,
            ProductFeatureTypes.empty(), ProductMetadata.empty(), ApplicabilityConstraintFactory.alwaysTrue());
    }

    static individuallyAndBatchTracked(id: ProductIdentifier, name: ProductName, description: ProductDescription, preferredUnit: Unit): ProductType {
        return new ProductType(id, name, description, preferredUnit, ProductTrackingStrategy.INDIVIDUALLY_AND_BATCH_TRACKED,
            ProductFeatureTypes.empty(), ProductMetadata.empty(), ApplicabilityConstraintFactory.alwaysTrue());
    }

    static identical(id: ProductIdentifier, name: ProductName, description: ProductDescription, preferredUnit: Unit): ProductType {
        return new ProductType(id, name, description, preferredUnit, ProductTrackingStrategy.IDENTICAL,
            ProductFeatureTypes.empty(), ProductMetadata.empty(), ApplicabilityConstraintFactory.alwaysTrue());
    }

    static builder(id: ProductIdentifier, name: ProductName, description: ProductDescription,
        preferredUnit: Unit, trackingStrategy: ProductTrackingStrategy): ProductTypeBuilder {
        return new ProductBuilder(id, name, description).asProductType(preferredUnit, trackingStrategy);
    }

    id(): ProductIdentifier { return this._id; }
    name(): ProductName { return this._name; }
    description(): ProductDescription { return this._description; }
    trackingStrategy(): ProductTrackingStrategy { return this._trackingStrategy; }
    featureTypes(): ProductFeatureTypes { return this._featureTypes; }
    metadata(): ProductMetadata { return this._metadata; }
    applicabilityConstraint(): ApplicabilityConstraint { return this._applicabilityConstraint; }
    identifier(): ProductIdentifier { return this._id; }

    isApplicableFor(context: ApplicabilityContext): boolean {
        return this._applicabilityConstraint.isSatisfiedBy(context);
    }

    toString(): string {
        return `ProductType{id=${this._id}, name=${this._name}, unit=${this.preferredUnit}, tracking=${this._trackingStrategy}, features=${this._featureTypes}}`;
    }
}

// Forward reference for builder - re-export
import { ProductTypeBuilder } from "./product-builder";
export { ProductTypeBuilder };
