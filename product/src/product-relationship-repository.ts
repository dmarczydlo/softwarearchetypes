import { ProductIdentifier } from "./product-identifier";
import { ProductRelationship, ProductRelationshipId, ProductRelationshipType } from "./product-relationship";

export interface ProductRelationshipRepository {
    findAllRelationsFrom(productIdentifier: ProductIdentifier): ProductRelationship[];
    findAllRelationsFromWithType(productIdentifier: ProductIdentifier, type: ProductRelationshipType): ProductRelationship[];
    findBy(relationshipId: ProductRelationshipId): ProductRelationship | null;
    save(productRelationship: ProductRelationship): void;
    delete(relationshipId: ProductRelationshipId): ProductRelationshipId | null;
    findMatching(predicate: (rel: ProductRelationship) => boolean): ProductRelationship[];
}

export class InMemoryProductRelationshipRepository implements ProductRelationshipRepository {
    private readonly storage: Map<string, ProductRelationship> = new Map();

    findAllRelationsFrom(productIdentifier: ProductIdentifier): ProductRelationship[] {
        return Array.from(this.storage.values())
            .filter(rel => rel.from.toString() === productIdentifier.toString());
    }

    findAllRelationsFromWithType(productIdentifier: ProductIdentifier, type: ProductRelationshipType): ProductRelationship[] {
        return Array.from(this.storage.values())
            .filter(rel => rel.from.toString() === productIdentifier.toString() && rel.type === type);
    }

    findBy(relationshipId: ProductRelationshipId): ProductRelationship | null {
        return this.storage.get(relationshipId.value) ?? null;
    }

    save(productRelationship: ProductRelationship): void {
        this.storage.set(productRelationship.id.value, productRelationship);
    }

    delete(relationshipId: ProductRelationshipId): ProductRelationshipId | null {
        const removed = this.storage.get(relationshipId.value);
        if (removed) {
            this.storage.delete(relationshipId.value);
            return removed.id;
        }
        return null;
    }

    findMatching(predicate: (rel: ProductRelationship) => boolean): ProductRelationship[] {
        return Array.from(this.storage.values()).filter(predicate);
    }
}
