import { FulfillmentService } from './fulfillment-service.js';
import { InventoryService } from './inventory-service.js';
import { PaymentService } from './payment-service.js';
import { PricingService } from './pricing-service.js';

export class OrderServices {
    readonly pricing: PricingService;
    readonly inventory: InventoryService;
    readonly payment: PaymentService;
    readonly fulfillment: FulfillmentService;

    constructor(pricing: PricingService, inventory: InventoryService,
                payment: PaymentService, fulfillment: FulfillmentService) {
        this.pricing = pricing;
        this.inventory = inventory;
        this.payment = payment;
        this.fulfillment = fulfillment;
    }
}
