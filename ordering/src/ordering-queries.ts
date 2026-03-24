import { OrderId } from './order-id.js';
import { OrderRepository } from './order-repository.js';
import { OrderView } from './order-view.js';

export class OrderingQueries {
    private readonly orderRepository: OrderRepository;

    constructor(orderRepository: OrderRepository) {
        this.orderRepository = orderRepository;
    }

    findById(id: OrderId): OrderView | null {
        const order = this.orderRepository.findById(id);
        return order ? OrderView.from(order) : null;
    }

    findAll(): OrderView[] {
        return this.orderRepository.findAll().map(o => OrderView.from(o));
    }
}
