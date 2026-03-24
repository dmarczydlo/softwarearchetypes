import { Preconditions } from "@softwarearchetypes/common";
import { Product } from "./product";
import { ProductIdentifier } from "./product-identifier";
import { ProductName } from "./product-name";
import { ProductDescription } from "./product-description";
import { ProductMetadata } from "./product-metadata";
import { ProductTrackingStrategy } from "./product-tracking-strategy";
import { ApplicabilityConstraint, ApplicabilityConstraintFactory, ApplicabilityContext } from "./applicability";
import { PackageStructure } from "./package-structure";
import { PackageValidationResult } from "./package-validation-result";
import { SelectedProduct } from "./selected-product";

export class PackageType implements Product {

    private readonly _id: ProductIdentifier;
    private readonly _name: ProductName;
    private readonly _description: ProductDescription;
    private readonly _trackingStrategy: ProductTrackingStrategy;
    private readonly _metadata: ProductMetadata;
    private readonly _applicabilityConstraint: ApplicabilityConstraint;
    private readonly _structure: PackageStructure;

    constructor(
        id: ProductIdentifier,
        name: ProductName,
        description: ProductDescription,
        trackingStrategy: ProductTrackingStrategy,
        metadata: ProductMetadata,
        applicabilityConstraint: ApplicabilityConstraint,
        structure: PackageStructure,
    ) {
        Preconditions.checkArgument(id != null, "ProductIdentifier must be defined");
        Preconditions.checkArgument(name != null, "ProductName must be defined");
        Preconditions.checkArgument(description != null, "ProductDescription must be defined");
        Preconditions.checkArgument(trackingStrategy != null, "ProductTrackingStrategy must be defined");
        Preconditions.checkArgument(metadata != null, "ProductMetadata must be defined");
        Preconditions.checkArgument(applicabilityConstraint != null, "ApplicabilityConstraint must be defined");
        Preconditions.checkArgument(structure != null, "PackageStructure must be defined");
        this._id = id;
        this._name = name;
        this._description = description;
        this._trackingStrategy = trackingStrategy;
        this._metadata = metadata;
        this._applicabilityConstraint = applicabilityConstraint;
        this._structure = structure;
    }

    static define(id: ProductIdentifier, name: ProductName, description: ProductDescription, structure: PackageStructure): PackageType {
        return new PackageType(id, name, description, ProductTrackingStrategy.INDIVIDUALLY_TRACKED,
            ProductMetadata.empty(), ApplicabilityConstraintFactory.alwaysTrue(), structure);
    }

    id(): ProductIdentifier { return this._id; }
    name(): ProductName { return this._name; }
    description(): ProductDescription { return this._description; }
    metadata(): ProductMetadata { return this._metadata; }
    applicabilityConstraint(): ApplicabilityConstraint { return this._applicabilityConstraint; }
    trackingStrategy(): ProductTrackingStrategy { return this._trackingStrategy; }
    structure(): PackageStructure { return this._structure; }

    isApplicableFor(context: ApplicabilityContext): boolean {
        return this._applicabilityConstraint.isSatisfiedBy(context);
    }

    validateSelection(selection: SelectedProduct[]): PackageValidationResult {
        return this._structure.validate(selection);
    }

    toString(): string {
        return `PackageType{id=${this._id}, name=${this._name}, tracking=${this._trackingStrategy}, structure=${this._structure}}`;
    }
}
