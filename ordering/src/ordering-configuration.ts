import { FixableFulfillmentService } from './fulfillment-service.js';
import { InMemoryOrderRepository } from './in-memory-order-repository.js';
import { FixableInventoryService } from './inventory-service.js';
import { OrderFactory } from './order-factory.js';
import { OrderServices } from './order-services.js';
import { OrderingFacade } from './ordering-facade.js';
import { OrderingQueries } from './ordering-queries.js';
import { FixablePaymentService } from './payment-service.js';
import { FixablePricingService } from './pricing-service.js';

export class OrderingConfiguration {
    private readonly _orderingFacade: OrderingFacade;
    private readonly _orderingQueries: OrderingQueries;
    private readonly _inventoryService: FixableInventoryService;
    private readonly _paymentService: FixablePaymentService;
    private readonly _fulfillmentService: FixableFulfillmentService;
    private readonly _pricingService: FixablePricingService;

    private constructor(
        orderingFacade: OrderingFacade,
        orderingQueries: OrderingQueries,
        inventoryService: FixableInventoryService,
        paymentService: FixablePaymentService,
        fulfillmentService: FixableFulfillmentService,
        pricingService: FixablePricingService
    ) {
        this._orderingFacade = orderingFacade;
        this._orderingQueries = orderingQueries;
        this._inventoryService = inventoryService;
        this._paymentService = paymentService;
        this._fulfillmentService = fulfillmentService;
        this._pricingService = pricingService;
    }

    static inMemory(): OrderingConfiguration {
        const inventory = new FixableInventoryService();
        const payment = new FixablePaymentService();
        const fulfillment = new FixableFulfillmentService();
        const pricing = new FixablePricingService();
        const services = new OrderServices(pricing, inventory, payment, fulfillment);
        const factory = new OrderFactory(services);
        const orderRepository = new InMemoryOrderRepository();
        const facade = new OrderingFacade(orderRepository, factory);
        const queries = new OrderingQueries(orderRepository);
        return new OrderingConfiguration(facade, queries, inventory, payment, fulfillment, pricing);
    }

    orderingFacade(): OrderingFacade {
        return this._orderingFacade;
    }

    orderingQueries(): OrderingQueries {
        return this._orderingQueries;
    }

    inventoryService(): FixableInventoryService {
        return this._inventoryService;
    }

    paymentService(): FixablePaymentService {
        return this._paymentService;
    }

    fulfillmentService(): FixableFulfillmentService {
        return this._fulfillmentService;
    }

    pricingService(): FixablePricingService {
        return this._pricingService;
    }
}
