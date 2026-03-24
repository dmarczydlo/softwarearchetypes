# @softwarearchetypes/product

## What is this archetype?

The product archetype provides a comprehensive model for product catalogs, product types, product instances, features, packages (bundles), and relationships between products. It separates the type level (what kinds of products exist and their feature definitions) from the instance level (specific product configurations with concrete feature values). Products can be organized into packages with selection rules and validated structures.

## When to use this archetype

- You need a product catalog with types, categories, and feature definitions
- You are modeling configurable products with typed features (text, numeric, boolean, date) and constraints (allowed values, ranges, regex)
- You need product bundles/packages with selection rules (mandatory, optional, exclusive choices)
- You want to track individual product instances with serial numbers (VIN, IMEI, ISBN, GTIN)
- You need relationships between products (upsell, cross-sell, requires, excludes, replaces)
- You are building an e-commerce catalog, telecom product offering, or insurance product structure
- You need to separate product definition (type) from product configuration (instance)

## Key concepts

- **ProductType** - Defines a kind of product with feature type definitions and tracking strategy
- **PackageType** - A product type that bundles other products with selection rules
- **Product / ProductFactory** - Creates product instances from types
- **ProductInstance** - A concrete configured product with feature values
- **PackageInstance** - A bundle instance containing selected product instances
- **ProductFeatureType / ProductFeatureTypeDefinition** - Defines what features a product type supports (name, value type, constraints)
- **ProductFeatureInstance** - A concrete feature value on a product instance
- **FeatureValueConstraint** - Validates feature values: AllowedValuesConstraint, NumericRangeConstraint, RegexConstraint, DateRangeConstraint
- **SelectionRule** - Controls package composition: IsSubsetOf, AndRule, OrRule, ConditionalRule
- **ProductRelationship** - Typed relationships between products (e.g., replaces, requires, recommends)
- **CatalogEntry / ProductCatalog** - Catalog structure for publishing product types with validity periods
- **ProductFacade** - High-level API for product management
- **ProductBuilder / InstanceBuilder** - Fluent builders for creating products and instances

## Installation

```bash
npm install @softwarearchetypes/product
```

## Dependencies

- `@softwarearchetypes/common`
- `@softwarearchetypes/quantity`

## Quick example

```typescript
import { ProductTypeBuilder, ProductInstanceBuilder, FeatureValueType } from '@softwarearchetypes/product';

// Define a product type with features
const laptopType = new ProductTypeBuilder("Laptop")
  .withFeature("RAM", FeatureValueType.NUMERIC, new NumericRangeConstraint(8, 128))
  .withFeature("Color", FeatureValueType.TEXT, new AllowedValuesConstraint(["Silver", "Black"]))
  .build();

// Create a product instance
const myLaptop = new ProductInstanceBuilder(laptopType)
  .withFeatureValue("RAM", 16)
  .withFeatureValue("Color", "Silver")
  .build();
```
