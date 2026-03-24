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

Clone the repository and install locally:

```bash
git clone <repo-url> archetypes-typescript
cd archetypes-typescript
npm install
```

Then link the archetype into your project:

```bash
npm install ../archetypes-typescript/product
```

## Dependencies

- `@softwarearchetypes/common`
- `@softwarearchetypes/quantity`

## Quick example

```typescript
import {
  ProductTypeBuilder,
  ProductInstanceBuilder,
  PackageTypeBuilder,
  PackageInstanceBuilder,
  FeatureValueType,
  NumericRangeConstraint,
  AllowedValuesConstraint,
  RegexConstraint,
  IsSubsetOf,
  ProductRelationshipType,
} from '@softwarearchetypes/product';

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

// Define a package type (bundle) with selection rules
const officeBundle = new PackageTypeBuilder("Office Bundle")
  .withComponent(laptopType)
  .withSelectionRule(new IsSubsetOf(["Laptop", "Monitor", "Keyboard"], { min: 2 }))
  .build();

// Create a package instance with chosen components
const myBundle = new PackageInstanceBuilder(officeBundle)
  .withComponent(myLaptop)
  .build();
```

## Real-world usage examples

### Telecom product catalog (mobile plans)

Model T-Mobile / Vodafone style mobile plans where data, minutes, and SMS allowances are
configurable features and add-on services are optional package components.

```typescript
import {
  ProductTypeBuilder,
  ProductInstanceBuilder,
  PackageTypeBuilder,
  PackageInstanceBuilder,
  FeatureValueType,
  NumericRangeConstraint,
  AllowedValuesConstraint,
  IsSubsetOf,
  OrRule,
} from '@softwarearchetypes/product';

// Core mobile plan type
const mobilePlanType = new ProductTypeBuilder("MobilePlan")
  .withFeature("dataGB",    FeatureValueType.NUMERIC, new NumericRangeConstraint(1, 500))
  .withFeature("minutes",   FeatureValueType.NUMERIC, new NumericRangeConstraint(0, 99999))
  .withFeature("sms",       FeatureValueType.NUMERIC, new NumericRangeConstraint(0, 99999))
  .withFeature("network",   FeatureValueType.TEXT,    new AllowedValuesConstraint(["4G", "5G"]))
  .withFeature("roaming",   FeatureValueType.BOOLEAN)
  .build();

// Add-on service types (data boosts, international calling, streaming perks)
const dataBoostType   = new ProductTypeBuilder("DataBoost")
  .withFeature("extraGB", FeatureValueType.NUMERIC, new NumericRangeConstraint(1, 50))
  .build();

const streamingPerkType = new ProductTypeBuilder("StreamingPerk")
  .withFeature("service", FeatureValueType.TEXT,
    new AllowedValuesConstraint(["Netflix", "Disney+", "Spotify"]))
  .build();

// Bundle plan with optional add-ons (customer picks 0–3)
const planBundleType = new PackageTypeBuilder("MobilePlanBundle")
  .withComponent(mobilePlanType)
  .withOptionalComponent(dataBoostType)
  .withOptionalComponent(streamingPerkType)
  .withSelectionRule(new IsSubsetOf(["DataBoost", "StreamingPerk"], { min: 0, max: 3 }))
  .build();

// Instantiate a "Magenta Max" style plan for a customer
const magentaMax = new ProductInstanceBuilder(mobilePlanType)
  .withFeatureValue("dataGB",  100)
  .withFeatureValue("minutes", 99999)
  .withFeatureValue("sms",     99999)
  .withFeatureValue("network", "5G")
  .withFeatureValue("roaming", true)
  .build();

const netflixPerk = new ProductInstanceBuilder(streamingPerkType)
  .withFeatureValue("service", "Netflix")
  .build();

const customerPlan = new PackageInstanceBuilder(planBundleType)
  .withComponent(magentaMax)
  .withComponent(netflixPerk)
  .build();
```

### Insurance product structure (policy types with coverage features)

Model policy products where coverage limits, deductibles, and optional riders are typed
features with validated ranges, and a policy package groups the base policy with chosen riders.

```typescript
import {
  ProductTypeBuilder,
  ProductInstanceBuilder,
  PackageTypeBuilder,
  PackageInstanceBuilder,
  FeatureValueType,
  NumericRangeConstraint,
  AllowedValuesConstraint,
  DateRangeConstraint,
  IsSubsetOf,
} from '@softwarearchetypes/product';

const today     = new Date();
const oneYear   = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
const fiveYears = new Date(today.getFullYear() + 5, today.getMonth(), today.getDate());

// Base homeowners policy
const homeownersType = new ProductTypeBuilder("HomeownersPolicyBase")
  .withFeature("dwellingCoverageUSD",    FeatureValueType.NUMERIC, new NumericRangeConstraint(50_000, 5_000_000))
  .withFeature("deductibleUSD",          FeatureValueType.NUMERIC, new NumericRangeConstraint(500, 25_000))
  .withFeature("liabilityCoverageUSD",   FeatureValueType.NUMERIC, new NumericRangeConstraint(100_000, 1_000_000))
  .withFeature("policyTerm",             FeatureValueType.TEXT,    new AllowedValuesConstraint(["1-year", "3-year"]))
  .withFeature("effectiveDate",          FeatureValueType.DATE,    new DateRangeConstraint(today, fiveYears))
  .build();

// Optional rider types
const floodRiderType = new ProductTypeBuilder("FloodRider")
  .withFeature("floodCoverageUSD", FeatureValueType.NUMERIC, new NumericRangeConstraint(10_000, 500_000))
  .build();

const jewelryRiderType = new ProductTypeBuilder("JewelryRider")
  .withFeature("itemDescription", FeatureValueType.TEXT)
  .withFeature("appraisedValueUSD", FeatureValueType.NUMERIC, new NumericRangeConstraint(500, 100_000))
  .build();

// Policy package: base + up to 2 optional riders
const homePackageType = new PackageTypeBuilder("HomeownersPolicy")
  .withComponent(homeownersType)
  .withOptionalComponent(floodRiderType)
  .withOptionalComponent(jewelryRiderType)
  .withSelectionRule(new IsSubsetOf(["FloodRider", "JewelryRider"], { min: 0, max: 2 }))
  .build();

// Instantiate a customer policy
const basePolicy = new ProductInstanceBuilder(homeownersType)
  .withFeatureValue("dwellingCoverageUSD",  350_000)
  .withFeatureValue("deductibleUSD",        2_500)
  .withFeatureValue("liabilityCoverageUSD", 300_000)
  .withFeatureValue("policyTerm",           "1-year")
  .withFeatureValue("effectiveDate",        oneYear)
  .build();

const floodRider = new ProductInstanceBuilder(floodRiderType)
  .withFeatureValue("floodCoverageUSD", 150_000)
  .build();

const customerPolicy = new PackageInstanceBuilder(homePackageType)
  .withComponent(basePolicy)
  .withComponent(floodRider)
  .build();
```

### Restaurant menu system (meal deals as packages with selection rules)

Model a fast-food meal deal where a customer picks exactly one main, one side from a defined
set, and an optional dessert — enforced via selection rules on a package type.

```typescript
import {
  ProductTypeBuilder,
  ProductInstanceBuilder,
  PackageTypeBuilder,
  PackageInstanceBuilder,
  FeatureValueType,
  AllowedValuesConstraint,
  NumericRangeConstraint,
  IsSubsetOf,
  AndRule,
} from '@softwarearchetypes/product';

// Item types
const mainType = new ProductTypeBuilder("Main")
  .withFeature("name",     FeatureValueType.TEXT,    new AllowedValuesConstraint(["Burger", "Wrap", "Salad"]))
  .withFeature("calories", FeatureValueType.NUMERIC, new NumericRangeConstraint(200, 1200))
  .build();

const sideType = new ProductTypeBuilder("Side")
  .withFeature("name",     FeatureValueType.TEXT,    new AllowedValuesConstraint(["Fries", "Salad", "Coleslaw"]))
  .withFeature("sizeOz",   FeatureValueType.NUMERIC, new NumericRangeConstraint(4, 16))
  .build();

const drinkType = new ProductTypeBuilder("Drink")
  .withFeature("name",    FeatureValueType.TEXT,    new AllowedValuesConstraint(["Cola", "Water", "OJ", "Milkshake"]))
  .withFeature("sizeOz",  FeatureValueType.NUMERIC, new NumericRangeConstraint(8, 32))
  .build();

const dessertType = new ProductTypeBuilder("Dessert")
  .withFeature("name", FeatureValueType.TEXT, new AllowedValuesConstraint(["Ice Cream", "Apple Pie", "Cookie"]))
  .build();

// Meal deal package: exactly 1 main + 1 side + 1 drink + optionally 1 dessert
const mealDealType = new PackageTypeBuilder("MealDeal")
  .withComponent(mainType)
  .withComponent(sideType)
  .withComponent(drinkType)
  .withOptionalComponent(dessertType)
  .withSelectionRule(
    new AndRule([
      new IsSubsetOf(["Main"],    { min: 1, max: 1 }),
      new IsSubsetOf(["Side"],    { min: 1, max: 1 }),
      new IsSubsetOf(["Drink"],   { min: 1, max: 1 }),
      new IsSubsetOf(["Dessert"], { min: 0, max: 1 }),
    ])
  )
  .build();

// Customer order
const burger = new ProductInstanceBuilder(mainType)
  .withFeatureValue("name",     "Burger")
  .withFeatureValue("calories", 650)
  .build();

const fries = new ProductInstanceBuilder(sideType)
  .withFeatureValue("name",   "Fries")
  .withFeatureValue("sizeOz", 8)
  .build();

const cola = new ProductInstanceBuilder(drinkType)
  .withFeatureValue("name",   "Cola")
  .withFeatureValue("sizeOz", 16)
  .build();

const customerOrder = new PackageInstanceBuilder(mealDealType)
  .withComponent(burger)
  .withComponent(fries)
  .withComponent(cola)
  .build();
```

### Automotive configurator (Tesla / BMW style)

Model a vehicle configurator where a base model carries typed features (color, drivetrain,
range), and optional packages (Autopilot, Premium Interior) are added via selection rules.

```typescript
import {
  ProductTypeBuilder,
  ProductInstanceBuilder,
  PackageTypeBuilder,
  PackageInstanceBuilder,
  ProductBuilder,
  FeatureValueType,
  AllowedValuesConstraint,
  NumericRangeConstraint,
  IsSubsetOf,
  ProductRelationshipType,
} from '@softwarearchetypes/product';

// Base vehicle model type
const vehicleModelType = new ProductTypeBuilder("VehicleModel")
  .withFeature("model",           FeatureValueType.TEXT,    new AllowedValuesConstraint(["Model 3", "Model Y", "Model S"]))
  .withFeature("color",           FeatureValueType.TEXT,    new AllowedValuesConstraint(["Pearl White", "Midnight Silver", "Deep Blue", "Solid Black", "Ultra Red"]))
  .withFeature("drivetrain",      FeatureValueType.TEXT,    new AllowedValuesConstraint(["RWD", "AWD", "Performance AWD"]))
  .withFeature("rangemiles",      FeatureValueType.NUMERIC, new NumericRangeConstraint(250, 450))
  .withFeature("autopilotLevel",  FeatureValueType.TEXT,    new AllowedValuesConstraint(["Standard", "Enhanced", "FSD"]))
  .build();

// Upgrade package types
const interiorPackageType = new ProductTypeBuilder("InteriorPackage")
  .withFeature("trim",    FeatureValueType.TEXT, new AllowedValuesConstraint(["Standard Black", "Premium White", "Wood Decor"]))
  .withFeature("seating", FeatureValueType.TEXT, new AllowedValuesConstraint(["5-seat", "7-seat"]))
  .build();

const wheelPackageType = new ProductTypeBuilder("WheelPackage")
  .withFeature("size",  FeatureValueType.NUMERIC, new NumericRangeConstraint(18, 22))
  .withFeature("style", FeatureValueType.TEXT,    new AllowedValuesConstraint(["Aero", "Sport", "Turbine"]))
  .build();

const towingPackageType = new ProductTypeBuilder("TowingPackage")
  .withFeature("maxWeightLbs", FeatureValueType.NUMERIC, new NumericRangeConstraint(2000, 7500))
  .build();

// Full vehicle configuration package
const vehicleConfigType = new PackageTypeBuilder("VehicleConfiguration")
  .withComponent(vehicleModelType)
  .withOptionalComponent(interiorPackageType)
  .withOptionalComponent(wheelPackageType)
  .withOptionalComponent(towingPackageType)
  .withSelectionRule(
    new AndRule([
      new IsSubsetOf(["VehicleModel"],    { min: 1, max: 1 }),
      new IsSubsetOf(["InteriorPackage"], { min: 0, max: 1 }),
      new IsSubsetOf(["WheelPackage"],    { min: 0, max: 1 }),
      new IsSubsetOf(["TowingPackage"],   { min: 0, max: 1 }),
    ])
  )
  .build();

// Customer configures a Model Y Long Range AWD
const baseModel = new ProductInstanceBuilder(vehicleModelType)
  .withFeatureValue("model",          "Model Y")
  .withFeatureValue("color",          "Deep Blue")
  .withFeatureValue("drivetrain",     "AWD")
  .withFeatureValue("rangemiles",     330)
  .withFeatureValue("autopilotLevel", "Enhanced")
  .build();

const premiumInterior = new ProductInstanceBuilder(interiorPackageType)
  .withFeatureValue("trim",    "Premium White")
  .withFeatureValue("seating", "7-seat")
  .build();

const sportWheels = new ProductInstanceBuilder(wheelPackageType)
  .withFeatureValue("size",  20)
  .withFeatureValue("style", "Sport")
  .build();

const customerConfig = new PackageInstanceBuilder(vehicleConfigType)
  .withComponent(baseModel)
  .withComponent(premiumInterior)
  .withComponent(sportWheels)
  .build();
```

### SaaS feature flags (product tiers: Free, Pro, Enterprise)

Model subscription tiers as product types whose boolean and numeric features encode which
capabilities are available. A catalog publishes all tiers; the application checks features
at runtime to gate access.

```typescript
import {
  ProductTypeBuilder,
  ProductInstanceBuilder,
  ProductCatalog,
  CatalogEntry,
  FeatureValueType,
  NumericRangeConstraint,
  AllowedValuesConstraint,
} from '@softwarearchetypes/product';

// Single subscription product type — tier is a feature, not a separate type
const subscriptionType = new ProductTypeBuilder("SaaSSubscription")
  .withFeature("tier",               FeatureValueType.TEXT,    new AllowedValuesConstraint(["Free", "Pro", "Enterprise"]))
  .withFeature("maxSeats",           FeatureValueType.NUMERIC, new NumericRangeConstraint(1, 100_000))
  .withFeature("storageGB",          FeatureValueType.NUMERIC, new NumericRangeConstraint(1, 10_000))
  .withFeature("apiCallsPerMonth",   FeatureValueType.NUMERIC, new NumericRangeConstraint(1_000, 100_000_000))
  .withFeature("ssoEnabled",         FeatureValueType.BOOLEAN)
  .withFeature("advancedAnalytics",  FeatureValueType.BOOLEAN)
  .withFeature("prioritySupport",    FeatureValueType.BOOLEAN)
  .withFeature("customDomain",       FeatureValueType.BOOLEAN)
  .withFeature("auditLogs",          FeatureValueType.BOOLEAN)
  .build();

// Tier definitions as pre-configured instances
const freeTier = new ProductInstanceBuilder(subscriptionType)
  .withFeatureValue("tier",              "Free")
  .withFeatureValue("maxSeats",          1)
  .withFeatureValue("storageGB",         5)
  .withFeatureValue("apiCallsPerMonth",  10_000)
  .withFeatureValue("ssoEnabled",        false)
  .withFeatureValue("advancedAnalytics", false)
  .withFeatureValue("prioritySupport",   false)
  .withFeatureValue("customDomain",      false)
  .withFeatureValue("auditLogs",         false)
  .build();

const proTier = new ProductInstanceBuilder(subscriptionType)
  .withFeatureValue("tier",              "Pro")
  .withFeatureValue("maxSeats",          25)
  .withFeatureValue("storageGB",         100)
  .withFeatureValue("apiCallsPerMonth",  500_000)
  .withFeatureValue("ssoEnabled",        false)
  .withFeatureValue("advancedAnalytics", true)
  .withFeatureValue("prioritySupport",   false)
  .withFeatureValue("customDomain",      true)
  .withFeatureValue("auditLogs",         false)
  .build();

const enterpriseTier = new ProductInstanceBuilder(subscriptionType)
  .withFeatureValue("tier",              "Enterprise")
  .withFeatureValue("maxSeats",          100_000)
  .withFeatureValue("storageGB",         10_000)
  .withFeatureValue("apiCallsPerMonth",  100_000_000)
  .withFeatureValue("ssoEnabled",        true)
  .withFeatureValue("advancedAnalytics", true)
  .withFeatureValue("prioritySupport",   true)
  .withFeatureValue("customDomain",      true)
  .withFeatureValue("auditLogs",         true)
  .build();

// Publish all tiers in the catalog
const catalog = new ProductCatalog();
catalog.publish(new CatalogEntry(subscriptionType, { validFrom: new Date() }));

// Feature-flag check at runtime
function canUseSSO(subscription: ProductInstance): boolean {
  return subscription.getFeatureValue("ssoEnabled") === true;
}

function getStorageQuotaGB(subscription: ProductInstance): number {
  return subscription.getFeatureValue("storageGB") as number;
}
```

### E-commerce product bundles (Amazon "Frequently bought together")

Model a bundle of complementary products using a package type with relationship metadata so
the storefront can surface upsell prompts and validate bundle composition before checkout.

```typescript
import {
  ProductTypeBuilder,
  ProductInstanceBuilder,
  PackageTypeBuilder,
  PackageInstanceBuilder,
  ProductBuilder,
  FeatureValueType,
  AllowedValuesConstraint,
  NumericRangeConstraint,
  RegexConstraint,
  IsSubsetOf,
  ProductRelationshipType,
} from '@softwarearchetypes/product';

// Individual product types
const cameraType = new ProductTypeBuilder("Camera")
  .withFeature("brand",         FeatureValueType.TEXT,    new AllowedValuesConstraint(["Sony", "Canon", "Nikon", "Fujifilm"]))
  .withFeature("megapixels",    FeatureValueType.NUMERIC, new NumericRangeConstraint(12, 61))
  .withFeature("bodyOnlyPrice", FeatureValueType.NUMERIC, new NumericRangeConstraint(400, 6000))
  .withTracking("serialNumber")
  .build();

const lensType = new ProductTypeBuilder("Lens")
  .withFeature("focalLengthMM", FeatureValueType.NUMERIC, new NumericRangeConstraint(8, 800))
  .withFeature("maxAperture",   FeatureValueType.TEXT,    new AllowedValuesConstraint(["f/1.2", "f/1.4", "f/1.8", "f/2.8", "f/4"]))
  .withFeature("mount",         FeatureValueType.TEXT,    new AllowedValuesConstraint(["E-mount", "RF", "Z", "X"]))
  .build();

const memoryCardType = new ProductTypeBuilder("MemoryCard")
  .withFeature("capacityGB",    FeatureValueType.NUMERIC, new NumericRangeConstraint(32, 2048))
  .withFeature("speedClassMBs", FeatureValueType.NUMERIC, new NumericRangeConstraint(90, 300))
  .build();

const cameraBagType = new ProductTypeBuilder("CameraBag")
  .withFeature("style", FeatureValueType.TEXT, new AllowedValuesConstraint(["Backpack", "Shoulder", "Sling"]))
  .build();

// "Frequently bought together" bundle: camera is mandatory; lens, card, bag are optional
const cameraBundleType = new PackageTypeBuilder("CameraStarterBundle")
  .withComponent(cameraType)
  .withOptionalComponent(lensType)
  .withOptionalComponent(memoryCardType)
  .withOptionalComponent(cameraBagType)
  .withSelectionRule(
    new AndRule([
      new IsSubsetOf(["Camera"],     { min: 1, max: 1 }),
      new IsSubsetOf(["Lens"],       { min: 0, max: 3 }),  // multiple lenses allowed
      new IsSubsetOf(["MemoryCard"], { min: 0, max: 2 }),
      new IsSubsetOf(["CameraBag"],  { min: 0, max: 1 }),
    ])
  )
  .build();

// Build products and declare cross-sell relationships
const sonyA7IV = new ProductBuilder(cameraType)
  .withFeatureValue("brand",         "Sony")
  .withFeatureValue("megapixels",    33)
  .withFeatureValue("bodyOnlyPrice", 2500)
  .build();

const sonyLens = new ProductBuilder(lensType)
  .withFeatureValue("focalLengthMM", 85)
  .withFeatureValue("maxAperture",   "f/1.4")
  .withFeatureValue("mount",         "E-mount")
  .build();

const sdCard = new ProductBuilder(memoryCardType)
  .withFeatureValue("capacityGB",    256)
  .withFeatureValue("speedClassMBs", 200)
  .build();

// Declare that the lens is a cross-sell recommendation for the camera body
sonyA7IV.addRelationship(sonyLens, ProductRelationshipType.CROSS_SELL);
sonyA7IV.addRelationship(sdCard,   ProductRelationshipType.REQUIRES);

// Instantiate the bundle for a customer's cart
const cameraBodyInstance = new ProductInstanceBuilder(cameraType)
  .fromProduct(sonyA7IV)
  .withSerialNumber("SN-20240315-001")
  .build();

const customerBundle = new PackageInstanceBuilder(cameraBundleType)
  .withComponent(cameraBodyInstance)
  .withComponent(new ProductInstanceBuilder(lensType).fromProduct(sonyLens).build())
  .withComponent(new ProductInstanceBuilder(memoryCardType).fromProduct(sdCard).build())
  .build();
```
