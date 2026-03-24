export class ProductIdentifier {
    readonly value: string;

    constructor(value: string) {
        this.value = value;
    }

    static of(value: string): ProductIdentifier {
        return new ProductIdentifier(value);
    }

    equals(other: ProductIdentifier): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
