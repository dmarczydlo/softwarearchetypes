import { Preconditions } from "@softwarearchetypes/common";
import { ProductIdentifier } from "./product-identifier";

export class ProductSet {
    private readonly _name: string;
    private readonly _products: Set<ProductIdentifier>;

    constructor(name: string, products: Set<ProductIdentifier>) {
        Preconditions.checkArgument(name != null && name.trim().length > 0, "ProductSet name must be defined");
        Preconditions.checkArgument(products != null && products.size > 0, "ProductSet must contain at least one product");
        this._name = name;
        this._products = new Set(products);
    }

    static singleOf(name: string, id: ProductIdentifier): ProductSet {
        return new ProductSet(name, new Set([id]));
    }

    static of(name: string, ...ids: ProductIdentifier[]): ProductSet {
        return new ProductSet(name, new Set(ids));
    }

    name(): string {
        return this._name;
    }

    products(): Set<ProductIdentifier> {
        return this._products;
    }

    contains(productId: ProductIdentifier): boolean {
        for (const p of this._products) {
            if (p.toString() === productId.toString()) return true;
        }
        return false;
    }

    toString(): string {
        return `ProductSet{name='${this._name}', products=${Array.from(this._products).map(p => p.toString()).join(", ")}}`;
    }
}
