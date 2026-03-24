import { OrderId } from '../order-id.js';
import { OrderLineId } from '../order-line-id.js';

export class SetArbitraryLinePriceCommand {
    readonly orderId: OrderId;
    readonly lineId: OrderLineId;
    readonly unitPrice: number;
    readonly totalPrice: number;
    readonly currency: string;
    readonly reason: string;

    constructor(
        orderId: OrderId,
        lineId: OrderLineId,
        unitPrice: number,
        totalPrice: number,
        currency: string,
        reason: string
    ) {
        this.orderId = orderId;
        this.lineId = lineId;
        this.unitPrice = unitPrice;
        this.totalPrice = totalPrice;
        this.currency = currency;
        this.reason = reason;
    }
}
