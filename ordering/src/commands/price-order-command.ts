import { OrderId } from '../order-id.js';

export class PriceOrderCommand {
    readonly orderId: OrderId;

    constructor(orderId: OrderId) {
        this.orderId = orderId;
    }
}
