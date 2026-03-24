import { randomUUID } from 'crypto';

export class ProductIdentifier {
    readonly value: string;

    constructor(value: string) {
        if (value == null) {
            throw new Error('ProductIdentifier value cannot be null');
        }
        if (value.trim().length === 0) {
            throw new Error('ProductIdentifier value cannot be blank');
        }
        this.value = value;
    }

    static of(value: string): ProductIdentifier {
        return new ProductIdentifier(value);
    }

    static random(): ProductIdentifier {
        return new ProductIdentifier(randomUUID());
    }

    equals(other: ProductIdentifier): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
