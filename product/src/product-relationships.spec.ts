import { describe, it, expect, beforeEach } from "vitest";
import { ProductConfiguration } from "./product-configuration";
import { ProductRelationshipsFacade } from "./product-relationships-facade";
import { ProductRelationshipsQueries } from "./product-relationships-queries";
import { InMemoryProductTypeRepository, ProductTypeRepository } from "./product-type-repository";
import { InMemoryProductRelationshipRepository } from "./product-relationship-repository";
import { ProductRelationshipFactory } from "./product-relationship-factory";
import { ProductRelationshipId, ProductRelationshipType } from "./product-relationship";
import { ProductType } from "./product-type";
import { UuidProductIdentifier } from "./product-identifier";
import { ProductName } from "./product-name";
import { ProductDescription } from "./product-description";
import { DefineRelationship, RemoveRelationship } from "./product-commands";
import { ProductRelationshipDefiningPolicy } from "./product-relationship-policy";

describe("ProductRelationshipsFacade", () => {
    let productTypeRepository: InMemoryProductTypeRepository;
    let facade: ProductRelationshipsFacade;
    let queries: ProductRelationshipsQueries;

    beforeEach(() => {
        productTypeRepository = new InMemoryProductTypeRepository();
        const factory = new ProductRelationshipFactory(() => ProductRelationshipId.random());
        const relationshipRepository = new InMemoryProductRelationshipRepository();
        facade = new ProductRelationshipsFacade(factory, relationshipRepository, productTypeRepository);
        queries = new ProductRelationshipsQueries(relationshipRepository);
    });

    function thereIsProduct(): ProductType {
        const pt = ProductType.define(
            UuidProductIdentifier.random(),
            ProductName.of("Test Product"),
            ProductDescription.of("Description"),
        );
        productTypeRepository.save(pt);
        return pt;
    }

    it("should fail to define relationship when from product does not exist", () => {
        const nonExistingFrom = UuidProductIdentifier.random();
        const existingTo = thereIsProduct();

        const result = facade.handleDefineRelationship(
            new DefineRelationship(nonExistingFrom.toString(), existingTo.identifier().toString(), "UPGRADABLE_TO"),
        );

        expect(result.failure()).toBe(true);
        expect(result.getFailure()).toContain("PRODUCT_NOT_FOUND");
    });

    it("should fail to define relationship when to product does not exist", () => {
        const existingFrom = thereIsProduct();
        const nonExistingTo = UuidProductIdentifier.random();

        const result = facade.handleDefineRelationship(
            new DefineRelationship(existingFrom.identifier().toString(), nonExistingTo.toString(), "UPGRADABLE_TO"),
        );

        expect(result.failure()).toBe(true);
        expect(result.getFailure()).toContain("PRODUCT_NOT_FOUND");
    });

    it("should define relationship between products", () => {
        const smallCoffee = thereIsProduct();
        const largeCoffee = thereIsProduct();

        const result = facade.handleDefineRelationship(
            new DefineRelationship(smallCoffee.identifier().toString(), largeCoffee.identifier().toString(), "UPGRADABLE_TO"),
        );

        expect(result.success()).toBe(true);
        const relationship = queries.findBy(result.getSuccess())!;
        expect(relationship.from.toString()).toBe(smallCoffee.identifier().toString());
        expect(relationship.to.toString()).toBe(largeCoffee.identifier().toString());
        expect(relationship.type).toBe(ProductRelationshipType.UPGRADABLE_TO);
    });

    it("should remove relationship between products", () => {
        const smallCoffee = thereIsProduct();
        const largeCoffee = thereIsProduct();
        const relationshipId = facade.handleDefineRelationship(
            new DefineRelationship(smallCoffee.identifier().toString(), largeCoffee.identifier().toString(), "UPGRADABLE_TO"),
        ).getSuccess();

        const result = facade.handleRemoveRelationship(new RemoveRelationship(relationshipId.value));

        expect(result.success()).toBe(true);
        expect(queries.findBy(relationshipId)).toBeNull();
    });

    it("should find all relations from product", () => {
        const burger = thereIsProduct();
        const fries = thereIsProduct();
        const coke = thereIsProduct();

        facade.handleDefineRelationship(new DefineRelationship(burger.identifier().toString(), fries.identifier().toString(), "COMPLEMENTED_BY"));
        facade.handleDefineRelationship(new DefineRelationship(burger.identifier().toString(), coke.identifier().toString(), "COMPLEMENTED_BY"));

        const relations = queries.findAllRelationsFromWithType(burger.identifier(), ProductRelationshipType.COMPLEMENTED_BY);

        expect(relations.length).toBe(2);
        expect(relations.every(r => r.from.toString() === burger.identifier().toString())).toBe(true);
        expect(relations.every(r => r.type === ProductRelationshipType.COMPLEMENTED_BY)).toBe(true);
    });
});

describe("ProductRelationshipPolicy", () => {
    it("should prevent self relationship", () => {
        const policy: ProductRelationshipDefiningPolicy = {
            canDefineFor(from, to, _type) {
                return from.toString() !== to.toString();
            }
        };

        const productId = UuidProductIdentifier.random();
        expect(policy.canDefineFor(productId, productId, ProductRelationshipType.COMPATIBLE_WITH)).toBe(false);
    });

    it("should allow relationship between different products", () => {
        const policy: ProductRelationshipDefiningPolicy = {
            canDefineFor(from, to, _type) {
                return from.toString() !== to.toString();
            }
        };

        const product1 = UuidProductIdentifier.random();
        const product2 = UuidProductIdentifier.random();
        expect(policy.canDefineFor(product1, product2, ProductRelationshipType.COMPATIBLE_WITH)).toBe(true);
    });
});
