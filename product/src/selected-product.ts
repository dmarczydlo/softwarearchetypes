import { Preconditions } from "@softwarearchetypes/common";
import { ProductIdentifier } from "./product-identifier";

export class SelectedProduct {
    readonly productId: ProductIdentifier;
    readonly quantity: number;

    constructor(productId: ProductIdentifier, quantity: number) {
        Preconditions.checkArgument(productId != null, "ProductId must be defined");
        Preconditions.checkArgument(quantity > 0, "Quantity must be > 0");
        this.productId = productId;
        this.quantity = quantity;
    }
}
