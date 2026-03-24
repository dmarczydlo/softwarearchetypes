import { Order } from './order.js';
import { OrderId } from './order-id.js';
import { OrderRepository } from './order-repository.js';

export class InMemoryOrderRepository implements OrderRepository {
    private readonly storage = new Map<string, Order>();

    save(order: Order): void {
        this.storage.set(order.id().value, order);
    }

    findById(id: OrderId): Order | null {
        return this.storage.get(id.value) ?? null;
    }

    findAll(): Order[] {
        return [...this.storage.values()];
    }
}
