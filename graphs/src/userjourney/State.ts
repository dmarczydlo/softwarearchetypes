import { Product, ProductType } from './Product.js';

export class State {
    readonly products: ReadonlySet<Product>;

    constructor(products: Set<Product>) {
        this.products = new Set(products);
    }

    static empty(): State {
        return new State(new Set());
    }

    static of(...products: Product[]): State {
        return new State(new Set(products));
    }

    withProduct(product: Product): State {
        const newProducts = new Set(this.products);
        newProducts.add(product);
        return new State(newProducts);
    }

    contains(productType: ProductType): boolean {
        for (const product of this.products) {
            if (product.type === productType) {
                return true;
            }
        }
        return false;
    }

    key(): string {
        const productKeys = [...this.products].map(p => p.key()).sort();
        return productKeys.join(',');
    }

    equals(other: State): boolean {
        return this.key() === other.key();
    }
}
