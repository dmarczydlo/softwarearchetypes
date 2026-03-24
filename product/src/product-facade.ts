import { Result, ResultFactory } from "@softwarearchetypes/common";
import { Unit } from "@softwarearchetypes/quantity";
import { ProductTypeRepository, InMemoryProductTypeRepository } from "./product-type-repository";
import { ProductIdentifier, UuidProductIdentifier, IsbnProductIdentifier, GtinProductIdentifier } from "./product-identifier";
import { ProductName } from "./product-name";
import { ProductDescription } from "./product-description";
import { ProductMetadata } from "./product-metadata";
import { ProductTrackingStrategy } from "./product-tracking-strategy";
import { ProductBuilder } from "./product-builder";
import { ProductFeatureType } from "./product-feature-type";
import { FeatureValueConstraint } from "./feature-value-constraint";
import { AllowedValuesConstraint } from "./allowed-values-constraint";
import { NumericRangeConstraint } from "./numeric-range-constraint";
import { DecimalRangeConstraint } from "./decimal-range-constraint";
import { RegexConstraint } from "./regex-constraint";
import { DateRangeConstraint } from "./date-range-constraint";
import { Unconstrained } from "./unconstrained";
import { FeatureValueType } from "./feature-value-type";
import { ProductType } from "./product-type";
import { ProductTypeView, FeatureTypeView } from "./product-views";
import { DefineProductType, MandatoryFeature, OptionalFeature, FeatureConstraintConfig } from "./product-commands";
import { FindProductTypeCriteria, FindByTrackingStrategyCriteria } from "./product-queries";

export class ProductFacade {

    private readonly repository: ProductTypeRepository;

    constructor(repository: ProductTypeRepository) {
        this.repository = repository;
    }

    static create(): ProductFacade {
        return new ProductFacade(new InMemoryProductTypeRepository());
    }

    handleDefineProductType(command: DefineProductType): Result<string, ProductIdentifier> {
        try {
            const productId = this.parseProductIdentifier(command.productIdType, command.productId);
            const name = ProductName.of(command.name);
            const description = ProductDescription.of(command.description);
            const unit = this.parseUnit(command.unit);
            const trackingStrategy = this.parseTrackingStrategy(command.trackingStrategy);

            const productBuilder = new ProductBuilder(productId, name, description);
            if (command.metadata != null) {
                productBuilder.withMetadata(ProductMetadata.of(command.metadata));
            }

            const typeBuilder = productBuilder.asProductType(unit, trackingStrategy);

            if (command.mandatoryFeatures != null) {
                for (const feature of command.mandatoryFeatures) {
                    typeBuilder.withMandatoryFeature(this.toProductFeatureType(feature.name, feature.constraint));
                }
            }
            if (command.optionalFeatures != null) {
                for (const feature of command.optionalFeatures) {
                    typeBuilder.withOptionalFeature(this.toProductFeatureType(feature.name, feature.constraint));
                }
            }

            const productType = typeBuilder.build();
            this.repository.save(productType);
            return ResultFactory.success(productId);
        } catch (e) {
            return ResultFactory.failure((e as Error).message);
        }
    }

    findByProductId(criteria: FindProductTypeCriteria): ProductTypeView | null {
        const pt = this.repository.findByIdValue(criteria.productId);
        return pt ? this.toProductTypeView(pt) : null;
    }

    findByTrackingStrategy(criteria: FindByTrackingStrategyCriteria): Set<ProductTypeView> {
        const strategy = this.parseTrackingStrategy(criteria.trackingStrategy);
        const result = new Set<ProductTypeView>();
        for (const pt of this.repository.findByTrackingStrategy(strategy)) {
            result.add(this.toProductTypeView(pt));
        }
        return result;
    }

    private parseProductIdentifier(type: string, value: string): ProductIdentifier {
        switch (type.toUpperCase()) {
            case "UUID": return UuidProductIdentifier.of(value);
            case "ISBN": return IsbnProductIdentifier.of(value);
            case "GTIN": return GtinProductIdentifier.of(value);
            default: throw new Error("Unknown product identifier type: " + type + ". Supported types: UUID, ISBN, GTIN");
        }
    }

    private parseTrackingStrategy(value: string): ProductTrackingStrategy {
        return ProductTrackingStrategy[value.toUpperCase() as keyof typeof ProductTrackingStrategy];
    }

    private parseUnit(symbol: string): Unit {
        switch (symbol.toLowerCase()) {
            case "pcs": case "pieces": return Unit.pieces();
            case "kg": case "kilograms": return Unit.kilograms();
            case "l": case "liters": return Unit.liters();
            case "m": case "meters": return Unit.meters();
            case "m\u00B2": case "m2": case "square meters": return Unit.squareMeters();
            case "m\u00B3": case "m3": case "cubic meters": return Unit.cubicMeters();
            case "h": case "hours": return Unit.hours();
            case "min": case "minutes": return Unit.minutes();
            default: return Unit.of(symbol, symbol);
        }
    }

    private toProductFeatureType(name: string, config: FeatureConstraintConfig): ProductFeatureType {
        const constraint = this.toConstraint(config);
        return ProductFeatureType.of(name, constraint);
    }

    private toConstraint(config: FeatureConstraintConfig): FeatureValueConstraint {
        switch (config.kind) {
            case "AllowedValuesConfig":
                return AllowedValuesConstraint.of(...config.allowedValues);
            case "NumericRangeConfig":
                return NumericRangeConstraint.between(config.min, config.max);
            case "DecimalRangeConfig":
                return DecimalRangeConstraint.of(config.min, config.max);
            case "RegexConfig":
                return RegexConstraint.of(config.pattern);
            case "DateRangeConfig":
                return DateRangeConstraint.between(config.from, config.to);
            case "UnconstrainedConfig":
                return new Unconstrained(FeatureValueType[config.valueType.toUpperCase() as keyof typeof FeatureValueType]);
        }
    }

    private toProductTypeView(pt: ProductType): ProductTypeView {
        return {
            productId: pt.id().toString(),
            name: pt.name().value,
            description: pt.description().value,
            unit: pt.preferredUnit.symbol,
            trackingStrategy: pt.trackingStrategy(),
            mandatoryFeatures: this.toFeatureTypeViews(pt.featureTypes().mandatoryFeatures()),
            optionalFeatures: this.toFeatureTypeViews(pt.featureTypes().optionalFeatures()),
        };
    }

    private toFeatureTypeViews(features: Set<ProductFeatureType>): Set<FeatureTypeView> {
        const result = new Set<FeatureTypeView>();
        for (const f of features) {
            result.add(this.toFeatureTypeView(f));
        }
        return result;
    }

    private toFeatureTypeView(featureType: ProductFeatureType): FeatureTypeView {
        const constraint = featureType.constraint();
        return {
            name: featureType.name(),
            valueType: constraint.valueType(),
            constraintType: constraint.type(),
            constraintConfig: this.constraintConfigToMap(constraint),
            constraintDescription: constraint.desc(),
        };
    }

    private constraintConfigToMap(constraint: FeatureValueConstraint): Record<string, unknown> {
        if (constraint instanceof AllowedValuesConstraint) return { allowedValues: constraint.allowedValues() };
        if (constraint instanceof NumericRangeConstraint) return { min: constraint.min(), max: constraint.max() };
        if (constraint instanceof DecimalRangeConstraint) return { min: constraint.min(), max: constraint.max() };
        if (constraint instanceof RegexConstraint) return { pattern: constraint.pattern() };
        if (constraint instanceof DateRangeConstraint) return { from: constraint.from(), to: constraint.to() };
        return {};
    }
}
