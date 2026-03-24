import { FulfillmentStatus } from './fulfillment-status.js';
import { OrderId } from './order-id.js';

export class FulfillmentUpdated {
    readonly orderId: OrderId;
    readonly status: FulfillmentStatus;
    readonly details: string;
    readonly occurredAt: Date;

    constructor(orderId: OrderId, status: FulfillmentStatus, details: string, occurredAt: Date) {
        this.orderId = orderId;
        this.status = status;
        this.details = details;
        this.occurredAt = occurredAt;
    }
}
