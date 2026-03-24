import { randomUUID } from "crypto";

/**
 * Represents planned production for a product - the PLAN entity.
 * Simple: product ID and target quantity. No dates, no complexity.
 */
export class PlannedProduction {
    readonly id: string;
    readonly productId: string;
    readonly targetQuantity: number;

    constructor(id: string, productId: string, targetQuantity: number) {
        this.id = id;
        this.productId = productId;
        this.targetQuantity = targetQuantity;
    }

    static of(productId: string, targetQuantity: number): PlannedProduction {
        return new PlannedProduction(randomUUID(), productId, targetQuantity);
    }

    toString(): string {
        return `Planned[${this.productId}: ${this.targetQuantity} units]`;
    }
}
