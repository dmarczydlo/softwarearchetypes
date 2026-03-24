import { Preconditions } from "@softwarearchetypes/common";

export class ProductDescription {
    readonly value: string;

    constructor(value: string) {
        Preconditions.checkArgument(value != null && value.trim().length > 0, "ProductDescription cannot be null or blank");
        this.value = value;
    }

    static of(value: string): ProductDescription {
        return new ProductDescription(value);
    }

    toString(): string {
        return this.value;
    }
}
