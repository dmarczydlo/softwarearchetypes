import { Quantity } from "@softwarearchetypes/quantity";

export class ProductStock {
    readonly productId: string;
    readonly quantity: Quantity;
    readonly daysInStock: number;

    constructor(productId: string, quantity: Quantity, daysInStock: number) {
        this.productId = productId;
        this.quantity = quantity;
        this.daysInStock = daysInStock;
    }
}
