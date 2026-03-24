import { OrderId } from '../order-id.js';
import { OrderLineId } from '../order-line-id.js';

export class ChangeOrderLineQuantityCommand {
    readonly orderId: OrderId;
    readonly lineId: OrderLineId;
    readonly newQuantity: number;
    readonly unit: string;

    constructor(orderId: OrderId, lineId: OrderLineId, newQuantity: number, unit: string) {
        this.orderId = orderId;
        this.lineId = lineId;
        this.newQuantity = newQuantity;
        this.unit = unit;
    }
}
