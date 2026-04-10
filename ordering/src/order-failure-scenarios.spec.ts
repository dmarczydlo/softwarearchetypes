import { describe, it, expect } from 'vitest';
import { OrderingConfiguration } from './ordering-configuration.js';
import { OrderView } from './order-view.js';
import { CreateOrderCommand, OrderPartyData, OrderLineData } from './commands/create-order-command.js';
import { AddOrderLineCommand } from './commands/add-order-line-command.js';
import { ConfirmOrderCommand } from './commands/confirm-order-command.js';
import { CancelOrderCommand } from './commands/cancel-order-command.js';
import { AllocationStatus } from './inventory-service.js';

describe('OrderFailureScenarios', () => {
    it('confirm fails when inventory unavailable - order stays draft', () => {
        const configuration = OrderingConfiguration.inMemory();
        const facade = configuration.orderingFacade();
        const queries = configuration.orderingQueries();

        configuration.inventoryService().willFailOnAllocate();
        const order = createSimpleOrder(configuration);

        const result = facade.handleConfirmOrder(new ConfirmOrderCommand(order.id));

        expect(result.failure()).toBe(true);
        expect(queries.findById(order.id)!.status).toBe("DRAFT");
        expect(configuration.paymentService().authorizeRequests()).toHaveLength(0);
        expect(configuration.fulfillmentService().startedOrders()).toHaveLength(0);
    });

    it('confirm fails when payment fails - order stays draft', () => {
        const configuration = OrderingConfiguration.inMemory();
        const facade = configuration.orderingFacade();
        const queries = configuration.orderingQueries();

        configuration.paymentService().willFailOnPayment("Insufficient funds");
        const order = createSimpleOrder(configuration);

        const result = facade.handleConfirmOrder(new ConfirmOrderCommand(order.id));

        expect(result.failure()).toBe(true);
        expect(queries.findById(order.id)!.status).toBe("DRAFT");
        expect(configuration.inventoryService().allocateRequests().length).toBeGreaterThan(0);
        expect(configuration.fulfillmentService().startedOrders()).toHaveLength(0);
    });

    it('cannot add line to confirmed order', () => {
        const configuration = OrderingConfiguration.inMemory();
        const facade = configuration.orderingFacade();

        const order = createSimpleOrder(configuration);
        facade.handleConfirmOrder(new ConfirmOrderCommand(order.id));

        const result = facade.handleAddOrderLine(
            new AddOrderLineCommand(order.id, "MOUSE", 1, "pieces", new Map()));

        expect(result.failure()).toBe(true);
    });

    it('cannot cancel already cancelled order', () => {
        const configuration = OrderingConfiguration.inMemory();
        const facade = configuration.orderingFacade();

        const order = createSimpleOrder(configuration);
        facade.handleCancelOrder(new CancelOrderCommand(order.id, "Changed mind"));

        const result = facade.handleCancelOrder(
            new CancelOrderCommand(order.id, "Double cancel"));

        expect(result.failure()).toBe(true);
    });

    it('confirm fails when inventory waitlisted', () => {
        const configuration = OrderingConfiguration.inMemory();
        const facade = configuration.orderingFacade();
        const queries = configuration.orderingQueries();

        configuration.inventoryService().willReturnOnAllocate(AllocationStatus.WAITLISTED);
        const order = createSimpleOrder(configuration);

        const result = facade.handleConfirmOrder(new ConfirmOrderCommand(order.id));

        expect(result.failure()).toBe(true);
        expect(queries.findById(order.id)!.status).toBe("DRAFT");
    });

    it('confirm fails when inventory partially allocated', () => {
        const configuration = OrderingConfiguration.inMemory();
        const facade = configuration.orderingFacade();
        const queries = configuration.orderingQueries();

        configuration.inventoryService().willReturnOnAllocate(AllocationStatus.PARTIAL);
        const order = createSimpleOrder(configuration);

        const result = facade.handleConfirmOrder(new ConfirmOrderCommand(order.id));

        expect(result.failure()).toBe(true);
        expect(queries.findById(order.id)!.status).toBe("DRAFT");
    });

    function createSimpleOrder(config: OrderingConfiguration): OrderView {
        return config.orderingFacade().handleCreateOrder(new CreateOrderCommand(
            [
                new OrderPartyData("customer-1", "Customer", "c@test.com",
                    new Set(["ORDERER", "PAYER", "RECEIVER"])),
                new OrderPartyData("shop-1", "Shop", "s@test.com",
                    new Set(["EXECUTOR"]))
            ],
            [new OrderLineData("PRODUCT-1", 1, "pieces", {}, null)]
        )).getSuccess();
    }
});
