import { Result, ResultFactory } from "@softwarearchetypes/common";
import { ProductIdentifier } from "./product-identifier";
import { ProductRelationship, ProductRelationshipId, ProductRelationshipType } from "./product-relationship";
import { ProductRelationshipDefiningPolicy, AlwaysAllowProductRelationshipDefiningPolicy } from "./product-relationship-policy";

export class ProductRelationshipFactory {

    private readonly policy: ProductRelationshipDefiningPolicy;
    private readonly idSupplier: () => ProductRelationshipId;

    constructor(
        idSupplier: () => ProductRelationshipId,
        policy?: ProductRelationshipDefiningPolicy,
    ) {
        this.policy = policy ?? new AlwaysAllowProductRelationshipDefiningPolicy();
        this.idSupplier = idSupplier;
    }

    defineFor(from: ProductIdentifier, to: ProductIdentifier, type: ProductRelationshipType): Result<string, ProductRelationship> {
        if (this.policy.canDefineFor(from, to, type)) {
            return ResultFactory.success(ProductRelationship.of(this.idSupplier(), from, to, type));
        } else {
            return ResultFactory.failure("POLICIES_NOT_MET");
        }
    }
}
