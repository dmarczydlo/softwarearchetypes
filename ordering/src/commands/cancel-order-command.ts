import { OrderId } from '../order-id.js';

export class CancelOrderCommand {
    readonly orderId: OrderId;
    readonly reason: string;

    constructor(orderId: OrderId, reason: string) {
        this.orderId = orderId;
        this.reason = reason;
    }
}
