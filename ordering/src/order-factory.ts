import { Order, OrderBuilder } from './order.js';
import { OrderId } from './order-id.js';
import { OrderParties } from './order-parties.js';
import { OrderServices } from './order-services.js';

export class OrderFactory {
    private readonly services: OrderServices;

    constructor(services: OrderServices) {
        this.services = services;
    }

    newOrder(id: OrderId, parties: OrderParties): OrderBuilder {
        return Order.builder(id, parties, this.services);
    }
}
