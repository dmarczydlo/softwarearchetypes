import { randomUUID } from "crypto";
import { ProductIdentifier } from "./product-identifier";

export enum ProductRelationshipType {
    UPGRADABLE_TO = "UPGRADABLE_TO",
    SUBSTITUTED_BY = "SUBSTITUTED_BY",
    REPLACED_BY = "REPLACED_BY",
    COMPLEMENTED_BY = "COMPLEMENTED_BY",
    COMPATIBLE_WITH = "COMPATIBLE_WITH",
    INCOMPATIBLE_WITH = "INCOMPATIBLE_WITH",
}

export class ProductRelationshipId {
    readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    static of(value: string): ProductRelationshipId {
        return new ProductRelationshipId(value);
    }

    static random(): ProductRelationshipId {
        return new ProductRelationshipId(randomUUID());
    }

    asString(): string {
        return this.value;
    }

    equals(other: ProductRelationshipId): boolean {
        return this.value === other.value;
    }
}

export class ProductRelationship {
    readonly id: ProductRelationshipId;
    readonly from: ProductIdentifier;
    readonly to: ProductIdentifier;
    readonly type: ProductRelationshipType;

    constructor(id: ProductRelationshipId, from: ProductIdentifier, to: ProductIdentifier, type: ProductRelationshipType) {
        this.id = id;
        this.from = from;
        this.to = to;
        this.type = type;
    }

    static of(id: ProductRelationshipId, from: ProductIdentifier, to: ProductIdentifier, type: ProductRelationshipType): ProductRelationship {
        return new ProductRelationship(id, from, to, type);
    }
}
