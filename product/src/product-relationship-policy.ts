import { ProductIdentifier } from "./product-identifier";
import { ProductRelationshipType } from "./product-relationship";

export interface ProductRelationshipDefiningPolicy {
    canDefineFor(from: ProductIdentifier, to: ProductIdentifier, type: ProductRelationshipType): boolean;
}

export class AlwaysAllowProductRelationshipDefiningPolicy implements ProductRelationshipDefiningPolicy {
    canDefineFor(_from: ProductIdentifier, _to: ProductIdentifier, _type: ProductRelationshipType): boolean {
        return true;
    }
}
