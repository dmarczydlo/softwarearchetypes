export interface ProductTypeView {
    readonly productId: string;
    readonly name: string;
    readonly description: string;
    readonly unit: string;
    readonly trackingStrategy: string;
    readonly mandatoryFeatures: Set<FeatureTypeView>;
    readonly optionalFeatures: Set<FeatureTypeView>;
}

export interface FeatureTypeView {
    readonly name: string;
    readonly valueType: string;
    readonly constraintType: string;
    readonly constraintConfig: Record<string, unknown>;
    readonly constraintDescription: string;
}

export interface CatalogEntryView {
    readonly catalogEntryId: string;
    readonly displayName: string;
    readonly description: string;
    readonly productTypeId: string;
    readonly categories: Set<string>;
    readonly availableFrom: string | null;
    readonly availableUntil: string | null;
    readonly metadata: Map<string, string>;
}

export interface MetadataView {
    readonly attributes: Map<string, string>;
}
