import { Order } from './order.js';
import { OrderId } from './order-id.js';
import { OrderLineView } from './order-line-view.js';
import { PartyInOrderView } from './party-in-order-view.js';

export class OrderView {
    readonly id: OrderId;
    readonly status: string;
    readonly lines: OrderLineView[];
    readonly parties: PartyInOrderView[];
    readonly totalPrice: string | null;

    constructor(
        id: OrderId,
        status: string,
        lines: OrderLineView[],
        parties: PartyInOrderView[],
        totalPrice: string | null
    ) {
        this.id = id;
        this.status = status;
        this.lines = lines;
        this.parties = parties;
        this.totalPrice = totalPrice;
    }

    static from(order: Order): OrderView {
        return new OrderView(
            order.id(),
            order.status(),
            order.lines().map(l => OrderLineView.from(l)),
            order.parties().parties().map(p => PartyInOrderView.from(p)),
            order.totalPrice()?.toString() ?? null
        );
    }
}
