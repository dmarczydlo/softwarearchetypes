// Value types and constraints
export { FeatureValueType, FeatureValueTypeOps } from "./feature-value-type";
export { FeatureValueConstraint, BaseFeatureValueConstraint } from "./feature-value-constraint";
export { AllowedValuesConstraint } from "./allowed-values-constraint";
export { NumericRangeConstraint } from "./numeric-range-constraint";
export { DecimalRangeConstraint } from "./decimal-range-constraint";
export { DateRangeConstraint } from "./date-range-constraint";
export { RegexConstraint } from "./regex-constraint";
export { Unconstrained } from "./unconstrained";

// Identifiers
export { ProductIdentifier, UuidProductIdentifier, GtinProductIdentifier, IsbnProductIdentifier } from "./product-identifier";
export { SerialNumber, TextualSerialNumber, VinSerialNumber, ImeiSerialNumber, SerialNumberFactory } from "./serial-number";
export { InstanceId } from "./instance-id";
export { CatalogEntryId } from "./catalog-entry-id";
export { BatchId, BatchName, Batch } from "./batch";

// Core product types
export { ProductName } from "./product-name";
export { ProductDescription } from "./product-description";
export { ProductMetadata } from "./product-metadata";
export { ProductTrackingStrategy, ProductTrackingStrategyOps } from "./product-tracking-strategy";
export { ServiceDeliveryStatus, ServiceDeliveryStatusOps } from "./service-delivery-status";
export { Validity } from "./validity";

// Features
export { ProductFeatureType } from "./product-feature-type";
export { ProductFeatureTypeDefinition } from "./product-feature-type-definition";
export { ProductFeatureTypes } from "./product-feature-types";
export { ProductFeatureInstance } from "./product-feature-instance";
export { ProductFeatureInstances } from "./product-feature-instances";

// Applicability
export {
    ApplicabilityContext,
    ApplicabilityConstraint,
    ApplicabilityConstraintFactory,
    AlwaysTrueConstraint,
    EqualsConstraint,
    InConstraint,
    GreaterThanConstraint,
    LessThanConstraint,
    BetweenConstraint,
    AndConstraint,
    OrConstraint,
    NotConstraint,
} from "./applicability";

// Product and Package types
export { Product, ProductFactory } from "./product";
export { ProductType } from "./product-type";
export { PackageType } from "./package-type";
export { ProductBuilder, ProductTypeBuilder, PackageTypeBuilder } from "./product-builder";

// Selection and package structure
export { ProductSet } from "./product-set";
export { SelectedProduct } from "./selected-product";
export { SelectionRule, IsSubsetOf, AndRule, OrRule, NotRule, ConditionalRule, SelectionRuleFactory } from "./selection-rule";
export { PackageStructure } from "./package-structure";
export { PackageValidationResult } from "./package-validation-result";

// Instances
export { Instance } from "./instance";
export { ProductInstance } from "./product-instance";
export { PackageInstance } from "./package-instance";
export { SelectedInstance } from "./selected-instance";
export { InstanceBuilder, ProductInstanceBuilder, PackageInstanceBuilder } from "./instance-builder";

// Relationships
export { ProductRelationship, ProductRelationshipId, ProductRelationshipType } from "./product-relationship";
export { ProductRelationshipDefiningPolicy, AlwaysAllowProductRelationshipDefiningPolicy } from "./product-relationship-policy";
export { ProductRelationshipFactory } from "./product-relationship-factory";
export { ProductRelationshipRepository, InMemoryProductRelationshipRepository } from "./product-relationship-repository";
export { ProductRelationshipsFacade } from "./product-relationships-facade";
export { ProductRelationshipsQueries } from "./product-relationships-queries";

// Catalog
export { CatalogEntry, CatalogEntryBuilder } from "./catalog-entry";
export { CatalogEntryRepository, InMemoryCatalogEntryRepository } from "./catalog-entry-repository";
export { ProductCatalog } from "./product-catalog";

// Repository
export { ProductTypeRepository, InMemoryProductTypeRepository } from "./product-type-repository";

// Facade and Configuration
export { ProductFacade } from "./product-facade";
export { ProductConfiguration } from "./product-configuration";

// Commands, Queries, Views
export * from "./product-commands";
export * from "./product-queries";
export * from "./product-views";
