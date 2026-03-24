export enum ProductType {
    NEW_LOAN = 'NEW_LOAN',
    PENALTY = 'PENALTY',
    DISCOUNT = 'DISCOUNT',
}

export class Product {
    readonly type: ProductType;
    readonly attributes: ReadonlyMap<string, unknown>;

    constructor(type: ProductType, attributes: Map<string, unknown> = new Map()) {
        this.type = type;
        this.attributes = new Map(attributes);
    }

    static of(type: ProductType, attributes?: Map<string, unknown>): Product {
        return new Product(type, attributes ?? new Map());
    }

    static newLoan(): Product {
        return new Product(ProductType.NEW_LOAN);
    }

    static penalty(): Product {
        return new Product(ProductType.PENALTY);
    }

    static discount(percentage: number): Product {
        return new Product(ProductType.DISCOUNT, new Map([['percentage', percentage]]));
    }

    key(): string {
        const attrEntries = [...this.attributes.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        return `${this.type}|${JSON.stringify(attrEntries)}`;
    }

    equals(other: Product): boolean {
        return this.key() === other.key();
    }
}
