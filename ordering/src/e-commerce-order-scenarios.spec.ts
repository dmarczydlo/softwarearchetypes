import { describe, it, expect } from 'vitest';
import { OrderingConfiguration } from './ordering-configuration.js';
import { FulfillmentStatus } from './fulfillment-status.js';
import { FulfillmentUpdated } from './fulfillment-updated.js';
import { CreateOrderCommand, OrderPartyData, OrderLineData } from './commands/create-order-command.js';
import { AddOrderLineCommand } from './commands/add-order-line-command.js';
import { ChangeOrderLineQuantityCommand } from './commands/change-order-line-quantity-command.js';
import { ConfirmOrderCommand } from './commands/confirm-order-command.js';

describe('ECommerceOrderScenarios', () => {
    it('full e-commerce order lifecycle', () => {
        const configuration = OrderingConfiguration.inMemory();
        const facade = configuration.orderingFacade();
        const queries = configuration.orderingQueries();

        // given
        let order = facade.handleCreateOrder(new CreateOrderCommand(
            [
                new OrderPartyData("customer-jan", "Jan Kowalski", "jan@example.com",
                    new Set(["ORDERER", "PAYER", "RECEIVER"])),
                new OrderPartyData("shop-online", "TechShop Online", "shop@tech.com",
                    new Set(["EXECUTOR"]))
            ],
            [new OrderLineData(
                "APPLE-IPHONE-15-PRO", 1, "pieces",
                { "color": "titanium-blue", "storage": "256GB" },
                null
            )]
        )).getSuccess();

        expect(order.status).toBe("DRAFT");
        expect(order.lines).toHaveLength(1);
        expect(order.lines[0].specification.get("color")).toBe("titanium-blue");

        // when - customer adds a mouse
        order = facade.handleAddOrderLine(
            new AddOrderLineCommand(order.id, "MOUSE-LOGITECH-MX3", 1, "pieces", new Map([["color", "black"]]))
        ).getSuccess();

        // then
        expect(order.lines).toHaveLength(2);

        // when - customer changes mouse quantity to 2
        const mouseLineId = order.lines[1].id;
        order = facade.handleChangeOrderLineQuantity(
            new ChangeOrderLineQuantityCommand(order.id, mouseLineId, 2, "pieces")
        ).getSuccess();

        // then
        expect(order.lines[1].quantity).toContain("2");

        // when - customer confirms the order
        const confirmResult = facade.handleConfirmOrder(new ConfirmOrderCommand(order.id));

        // then - inventory allocated, payment captured, fulfillment started
        expect(confirmResult.success()).toBe(true);
        order = confirmResult.getSuccess();
        expect(order.status).toBe("CONFIRMED");
        expect(configuration.inventoryService().allocateRequests()).toHaveLength(2);
        expect(configuration.paymentService().authorizeRequests()).toHaveLength(1);
        expect(configuration.fulfillmentService().startedOrders()).toHaveLength(1);

        // when - fulfillment starts
        facade.handleFulfillmentUpdated(new FulfillmentUpdated(
            order.id, FulfillmentStatus.IN_PROGRESS, "Items being picked", new Date()));

        // then
        order = queries.findById(order.id)!;
        expect(order.status).toBe("PROCESSING");

        // when - fulfillment completes
        facade.handleFulfillmentUpdated(new FulfillmentUpdated(
            order.id, FulfillmentStatus.COMPLETED, "Delivered to customer", new Date()));

        // then
        order = queries.findById(order.id)!;
        expect(order.status).toBe("FULFILLED");
    });
});
