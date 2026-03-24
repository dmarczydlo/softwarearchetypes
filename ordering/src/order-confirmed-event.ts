import { Money } from '@softwarearchetypes/quantity';
import { OrderId } from './order-id.js';
import { OrderLine } from './order-line.js';
import { PartyId } from './party-id.js';

export class OrderConfirmedEvent {
    readonly orderId: OrderId;
    readonly totalPrice: Money;
    readonly payerId: PartyId;
    readonly lines: OrderLine[];
    readonly occurredAt: Date;

    constructor(orderId: OrderId, totalPrice: Money, payerId: PartyId, lines: OrderLine[], occurredAt: Date) {
        this.orderId = orderId;
        this.totalPrice = totalPrice;
        this.payerId = payerId;
        this.lines = lines;
        this.occurredAt = occurredAt;
    }
}
