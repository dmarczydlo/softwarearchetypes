import { OrderId } from './order-id.js';

export interface FulfillmentService {
    startFulfillment(orderId: OrderId): void;
    cancelFulfillment(orderId: OrderId): void;
}

export class FixableFulfillmentService implements FulfillmentService {
    private shouldThrowOnStart = false;
    private readonly _startedOrders: OrderId[] = [];
    private readonly _cancelledOrders: OrderId[] = [];

    willFailOnStart(): void {
        this.shouldThrowOnStart = true;
    }

    reset(): void {
        this.shouldThrowOnStart = false;
        this._startedOrders.length = 0;
        this._cancelledOrders.length = 0;
    }

    startedOrders(): OrderId[] {
        return [...this._startedOrders];
    }

    cancelledOrders(): OrderId[] {
        return [...this._cancelledOrders];
    }

    startFulfillment(orderId: OrderId): void {
        if (this.shouldThrowOnStart) {
            throw new Error("Fulfillment service unavailable");
        }
        this._startedOrders.push(orderId);
    }

    cancelFulfillment(orderId: OrderId): void {
        this._cancelledOrders.push(orderId);
    }
}
