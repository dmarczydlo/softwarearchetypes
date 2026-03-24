import { ProductIdentifier } from "./product-identifier";
import { ProductName } from "./product-name";
import { ProductDescription } from "./product-description";
import { ProductMetadata } from "./product-metadata";
import { ApplicabilityConstraint, ApplicabilityContext } from "./applicability";
import { ProductBuilder } from "./product-builder";

export interface Product {
    id(): ProductIdentifier;
    name(): ProductName;
    description(): ProductDescription;
    metadata(): ProductMetadata;
    applicabilityConstraint(): ApplicabilityConstraint;
    isApplicableFor(context: ApplicabilityContext): boolean;
}

export const ProductFactory = {
    builder(id: ProductIdentifier, name: ProductName, description: ProductDescription): ProductBuilder {
        return new ProductBuilder(id, name, description);
    }
};
