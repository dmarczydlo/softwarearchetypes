import { Result, ResultFactory } from "@softwarearchetypes/common";
import { ProductIdentifier, UuidProductIdentifier } from "./product-identifier";
import { ProductRelationship, ProductRelationshipId, ProductRelationshipType } from "./product-relationship";
import { ProductRelationshipFactory } from "./product-relationship-factory";
import { ProductRelationshipRepository } from "./product-relationship-repository";
import { ProductTypeRepository } from "./product-type-repository";
import { DefineRelationship, RemoveRelationship } from "./product-commands";

export class ProductRelationshipsFacade {

    private readonly factory: ProductRelationshipFactory;
    private readonly repository: ProductRelationshipRepository;
    private readonly productTypeRepository: ProductTypeRepository;

    constructor(
        factory: ProductRelationshipFactory,
        repository: ProductRelationshipRepository,
        productTypeRepository: ProductTypeRepository,
    ) {
        this.factory = factory;
        this.repository = repository;
        this.productTypeRepository = productTypeRepository;
    }

    handleDefineRelationship(command: DefineRelationship): Result<string, ProductRelationshipId> {
        try {
            const from = this.parseProductIdentifier(command.fromProductId);
            const to = this.parseProductIdentifier(command.toProductId);
            const type = this.parseRelationshipType(command.relationshipType);

            if (this.productTypeRepository.findById(from) == null) {
                return ResultFactory.failure("PRODUCT_NOT_FOUND: " + from.toString());
            }
            if (this.productTypeRepository.findById(to) == null) {
                return ResultFactory.failure("PRODUCT_NOT_FOUND: " + to.toString());
            }

            const result = this.factory.defineFor(from, to, type);
            if (result.success()) {
                this.repository.save(result.getSuccess());
                return ResultFactory.success(result.getSuccess().id);
            }
            return ResultFactory.failure(result.getFailure());
        } catch (e) {
            return ResultFactory.failure((e as Error).message);
        }
    }

    handleRemoveRelationship(command: RemoveRelationship): Result<string, ProductRelationshipId> {
        try {
            const relationshipId = ProductRelationshipId.of(command.relationshipId);
            this.repository.delete(relationshipId);
            return ResultFactory.success(relationshipId);
        } catch (e) {
            return ResultFactory.failure((e as Error).message);
        }
    }

    private parseProductIdentifier(value: string): ProductIdentifier {
        return UuidProductIdentifier.of(value);
    }

    private parseRelationshipType(type: string): ProductRelationshipType {
        return ProductRelationshipType[type.toUpperCase() as keyof typeof ProductRelationshipType];
    }
}
