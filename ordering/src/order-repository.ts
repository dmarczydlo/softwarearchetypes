import { Order } from './order.js';
import { OrderId } from './order-id.js';

export interface OrderRepository {
    save(order: Order): void;
    findById(id: OrderId): Order | null;
    findAll(): Order[];
}
