import { OrderId } from '../order-id.js';

export class ConfirmOrderCommand {
    readonly orderId: OrderId;

    constructor(orderId: OrderId) {
        this.orderId = orderId;
    }
}
