import { Result, ResultFactory } from '@softwarearchetypes/common';
import { ProductIdentifier } from './product-identifier';
import { ProductTrackingStrategy } from './product-tracking-strategy';

export interface ProductDefinitionValidator {
    validate(
        productId: ProductIdentifier,
        strategy: ProductTrackingStrategy,
        features: Map<string, string>,
    ): Result<string, void>;
}

export function alwaysValidValidator(): ProductDefinitionValidator {
    return {
        validate: () => ResultFactory.success<string, void>(undefined),
    };
}
