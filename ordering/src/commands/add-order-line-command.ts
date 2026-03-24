import { OrderId } from '../order-id.js';

export class AddOrderLineCommand {
    readonly orderId: OrderId;
    readonly productId: string;
    readonly quantity: number;
    readonly unit: string;
    readonly specification: Map<string, string> | Record<string, string>;

    constructor(
        orderId: OrderId,
        productId: string,
        quantity: number,
        unit: string,
        specification: Map<string, string> | Record<string, string>
    ) {
        this.orderId = orderId;
        this.productId = productId;
        this.quantity = quantity;
        this.unit = unit;
        this.specification = specification;
    }
}
