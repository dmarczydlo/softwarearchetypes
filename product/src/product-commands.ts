import { Preconditions } from "@softwarearchetypes/common";

// Feature Constraint Configurations
export type FeatureConstraintConfig =
    | AllowedValuesConfig
    | NumericRangeConfig
    | DecimalRangeConfig
    | RegexConfig
    | DateRangeConfig
    | UnconstrainedConfig;

export class AllowedValuesConfig {
    readonly kind = "AllowedValuesConfig" as const;
    readonly allowedValues: Set<string>;
    constructor(allowedValues: Set<string>) {
        Preconditions.checkArgument(allowedValues != null && allowedValues.size > 0, "Allowed values must not be empty");
        this.allowedValues = allowedValues;
    }
}

export class NumericRangeConfig {
    readonly kind = "NumericRangeConfig" as const;
    constructor(readonly min: number, readonly max: number) {
        Preconditions.checkArgument(min <= max, "Min must be less than or equal to max");
    }
}

export class DecimalRangeConfig {
    readonly kind = "DecimalRangeConfig" as const;
    constructor(readonly min: string, readonly max: string) {
        Preconditions.checkNotNull(min, "Min must be defined");
        Preconditions.checkNotNull(max, "Max must be defined");
    }
}

export class RegexConfig {
    readonly kind = "RegexConfig" as const;
    constructor(readonly pattern: string) {
        Preconditions.checkArgument(pattern != null && pattern.trim().length > 0, "Pattern must be defined");
    }
}

export class DateRangeConfig {
    readonly kind = "DateRangeConfig" as const;
    constructor(readonly from: string, readonly to: string) {
        Preconditions.checkNotNull(from, "From date must be defined");
        Preconditions.checkNotNull(to, "To date must be defined");
    }
}

export class UnconstrainedConfig {
    readonly kind = "UnconstrainedConfig" as const;
    constructor(readonly valueType: string) {
        Preconditions.checkArgument(valueType != null && valueType.trim().length > 0, "Value type must be defined");
    }
}

// ProductFacade Commands
export class DefineProductType {
    constructor(
        readonly productIdType: string,
        readonly productId: string,
        readonly name: string,
        readonly description: string,
        readonly unit: string,
        readonly trackingStrategy: string,
        readonly mandatoryFeatures: Set<MandatoryFeature>,
        readonly optionalFeatures: Set<OptionalFeature>,
        readonly metadata: Record<string, string>,
    ) {
        Preconditions.checkArgument(productIdType != null && productIdType.trim().length > 0, "Product ID type must be defined");
        Preconditions.checkArgument(productId != null && productId.trim().length > 0, "Product ID must be defined");
        Preconditions.checkArgument(name != null && name.trim().length > 0, "Name must be defined");
        Preconditions.checkArgument(description != null && description.trim().length > 0, "Description must be defined");
        Preconditions.checkArgument(unit != null && unit.trim().length > 0, "Unit must be defined");
        Preconditions.checkArgument(trackingStrategy != null && trackingStrategy.trim().length > 0, "Tracking strategy must be defined");
    }
}

export class MandatoryFeature {
    constructor(readonly name: string, readonly constraint: FeatureConstraintConfig) {
        Preconditions.checkArgument(name != null && name.trim().length > 0, "Feature name must be defined");
        Preconditions.checkNotNull(constraint, "Constraint must be defined");
    }
}

export class OptionalFeature {
    constructor(readonly name: string, readonly constraint: FeatureConstraintConfig) {
        Preconditions.checkArgument(name != null && name.trim().length > 0, "Feature name must be defined");
        Preconditions.checkNotNull(constraint, "Constraint must be defined");
    }
}

// ProductCatalog Commands
export class AddToOffer {
    constructor(
        readonly productTypeId: string,
        readonly displayName: string,
        readonly description: string,
        readonly categories: Set<string>,
        readonly availableFrom: string | null,
        readonly availableUntil: string | null,
        readonly metadata: Record<string, string>,
    ) {
        Preconditions.checkArgument(productTypeId != null && productTypeId.trim().length > 0, "Product type ID must be defined");
        Preconditions.checkArgument(displayName != null && displayName.trim().length > 0, "Display name must be defined");
        Preconditions.checkArgument(description != null && description.trim().length > 0, "Description must be defined");
    }
}

export class DiscontinueProduct {
    constructor(readonly catalogEntryId: string, readonly discontinuationDate: string) {
        Preconditions.checkArgument(catalogEntryId != null && catalogEntryId.trim().length > 0, "Catalog entry ID must be defined");
        Preconditions.checkNotNull(discontinuationDate, "Discontinuation date must be defined");
    }
}

export class UpdateMetadata {
    constructor(readonly catalogEntryId: string, readonly metadata: Record<string, string>) {
        Preconditions.checkArgument(catalogEntryId != null && catalogEntryId.trim().length > 0, "Catalog entry ID must be defined");
        Preconditions.checkNotNull(metadata, "Metadata must be defined");
    }
}

// ProductRelationship Commands
export class DefineRelationship {
    constructor(readonly fromProductId: string, readonly toProductId: string, readonly relationshipType: string) {
        Preconditions.checkArgument(fromProductId != null && fromProductId.trim().length > 0, "From product ID must be defined");
        Preconditions.checkArgument(toProductId != null && toProductId.trim().length > 0, "To product ID must be defined");
        Preconditions.checkArgument(relationshipType != null && relationshipType.trim().length > 0, "Relationship type must be defined");
    }
}

export class RemoveRelationship {
    constructor(readonly relationshipId: string) {
        Preconditions.checkArgument(relationshipId != null, "Relationship ID must be defined");
    }
}
