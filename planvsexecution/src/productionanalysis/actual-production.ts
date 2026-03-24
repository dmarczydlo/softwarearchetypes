import { randomUUID } from "crypto";

/**
 * Represents actual production output - the EXECUTION entity.
 * What was really produced: product ID and actual quantity.
 */
export class ActualProduction {
    readonly id: string;
    readonly productId: string;
    readonly producedQuantity: number;

    constructor(id: string, productId: string, producedQuantity: number) {
        this.id = id;
        this.productId = productId;
        this.producedQuantity = producedQuantity;
    }

    static of(productId: string, producedQuantity: number): ActualProduction {
        return new ActualProduction(randomUUID(), productId, producedQuantity);
    }

    toString(): string {
        return `Produced[${this.productId}: ${this.producedQuantity} units]`;
    }
}
