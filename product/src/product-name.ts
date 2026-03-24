import { Preconditions } from "@softwarearchetypes/common";

export class ProductName {
    readonly value: string;

    constructor(value: string) {
        Preconditions.checkArgument(value != null && value.trim().length > 0, "ProductName cannot be null or blank");
        this.value = value;
    }

    static of(value: string): ProductName {
        return new ProductName(value);
    }

    toString(): string {
        return this.value;
    }

    equals(other: ProductName): boolean {
        return this.value === other.value;
    }
}
