import { ProductIdentifier } from "./product-identifier";
import { ProductRelationship, ProductRelationshipId, ProductRelationshipType } from "./product-relationship";
import { ProductRelationshipRepository } from "./product-relationship-repository";

export class ProductRelationshipsQueries {

    private readonly repository: ProductRelationshipRepository;

    constructor(repository: ProductRelationshipRepository) {
        this.repository = repository;
    }

    findBy(relationshipId: ProductRelationshipId): ProductRelationship | null {
        return this.repository.findBy(relationshipId);
    }

    findAllRelationsFrom(productIdentifier: ProductIdentifier): ProductRelationship[] {
        return this.repository.findAllRelationsFrom(productIdentifier);
    }

    findAllRelationsFromWithType(productIdentifier: ProductIdentifier, type: ProductRelationshipType): ProductRelationship[] {
        return this.repository.findAllRelationsFromWithType(productIdentifier, type);
    }

    findAllRelationsFromListWithType(productIdentifiers: ProductIdentifier[], type: ProductRelationshipType): ProductRelationship[] {
        return productIdentifiers.flatMap(id => this.repository.findAllRelationsFromWithType(id, type));
    }

    findMatching(predicate: (rel: ProductRelationship) => boolean): ProductRelationship[] {
        return this.repository.findMatching(predicate);
    }
}
