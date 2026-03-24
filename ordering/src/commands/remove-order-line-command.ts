import { OrderId } from '../order-id.js';
import { OrderLineId } from '../order-line-id.js';

export class RemoveOrderLineCommand {
    readonly orderId: OrderId;
    readonly lineId: OrderLineId;

    constructor(orderId: OrderId, lineId: OrderLineId) {
        this.orderId = orderId;
        this.lineId = lineId;
    }
}
