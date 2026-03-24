import { describe, it, expect } from 'vitest';
import { Result } from '@softwarearchetypes/common';
import { OrderingConfiguration } from './ordering-configuration.js';
import { OrderingFacade } from './ordering-facade.js';
import { OrderingQueries } from './ordering-queries.js';
import { OrderView } from './order-view.js';
import { FulfillmentStatus } from './fulfillment-status.js';
import { FulfillmentUpdated } from './fulfillment-updated.js';
import { CreateOrderCommand, OrderPartyData, OrderLineData } from './commands/create-order-command.js';
import { AddOrderLineCommand } from './commands/add-order-line-command.js';
import { RemoveOrderLineCommand } from './commands/remove-order-line-command.js';
import { ChangeOrderLineQuantityCommand } from './commands/change-order-line-quantity-command.js';
import { ConfirmOrderCommand } from './commands/confirm-order-command.js';
import { CancelOrderCommand } from './commands/cancel-order-command.js';

describe('OrderingFacade', () => {
    const configuration = OrderingConfiguration.inMemory();
    const facade = configuration.orderingFacade();
    const queries = configuration.orderingQueries();

    it('should create simple order', () => {
        const result = facade.handleCreateOrder(simpleOrderCommand("APPLE-IPHONE-15-PRO", 1, "pieces"));

        expect(result.isSuccess()).toBe(true);
        const view = result.getSuccess();
        expect(view.status).toBe("DRAFT");
        expect(view.lines).toHaveLength(1);
        expect(view.lines[0].productId).toBe("APPLE-IPHONE-15-PRO");
    });

    it('should create order with multiple lines', () => {
        const command = new CreateOrderCommand(
            defaultParties(),
            [
                new OrderLineData("LAPTOP-DELL-5540", 1, "pieces", { "color": "black" }, null),
                new OrderLineData("MOUSE-LOGITECH-MX3", 2, "pieces", {}, null)
            ]
        );

        const result = facade.handleCreateOrder(command);

        expect(result.isSuccess()).toBe(true);
        expect(result.getSuccess().lines).toHaveLength(2);
    });

    it('should create order with specification', () => {
        const command = new CreateOrderCommand(
            defaultParties(),
            [new OrderLineData(
                "BMW-X5-2024", 1, "pieces",
                { "vin": "WBA12345678901234", "color": "black" },
                null
            )]
        );

        const result = facade.handleCreateOrder(command);

        expect(result.isSuccess()).toBe(true);
        const line = result.getSuccess().lines[0];
        expect(line.specification.get("vin")).toBe("WBA12345678901234");
        expect(line.specification.get("color")).toBe("black");
    });

    it('should create order with corporate parties', () => {
        const command = new CreateOrderCommand(
            [
                new OrderPartyData("company-abc", "ABC Corp", "abc@corp.com",
                    new Set(["ORDERER", "PAYER"])),
                new OrderPartyData("vendor-xyz", "XYZ Vendor", "vendor@xyz.com",
                    new Set(["EXECUTOR"])),
                new OrderPartyData("branch-warsaw", "Warsaw Branch", "warsaw@abc.com",
                    new Set(["RECEIVER"]))
            ],
            [new OrderLineData("LAPTOP-DELL-5540", 5, "pieces", {}, null)]
        );

        const result = facade.handleCreateOrder(command);

        expect(result.isSuccess()).toBe(true);
        const view = result.getSuccess();
        expect(view.parties).toHaveLength(3);
        expect(view.parties.some(p =>
            p.partyId === "company-abc" && p.roles.has("ORDERER") && p.roles.has("PAYER"))).toBe(true);
        expect(view.parties.some(p =>
            p.partyId === "vendor-xyz" && p.roles.has("EXECUTOR"))).toBe(true);
        expect(view.parties.some(p =>
            p.partyId === "branch-warsaw" && p.roles.has("RECEIVER"))).toBe(true);
    });

    it('should create order with line level parties', () => {
        const command = new CreateOrderCommand(
            defaultParties(),
            [new OrderLineData(
                "LAPTOP-DELL-5540", 1, "pieces", {},
                [new OrderPartyData(
                    "branch-cracow", "Cracow Branch", "cracow@shop.com",
                    new Set(["RECEIVER"]))]
            )]
        );

        const result = facade.handleCreateOrder(command);

        expect(result.isSuccess()).toBe(true);
        const line = result.getSuccess().lines[0];
        expect(line.parties).toHaveLength(1);
        expect(line.parties[0].partyId).toBe("branch-cracow");
        expect(line.parties[0].roles.has("RECEIVER")).toBe(true);
    });

    it('should add line to existing draft order', () => {
        const created = facade.handleCreateOrder(simpleOrderCommand("LAPTOP-DELL-5540", 1, "pieces")).getSuccess();

        const result = facade.handleAddOrderLine(
            new AddOrderLineCommand(created.id, "MOUSE-LOGITECH-MX3", 2, "pieces", {}));

        expect(result.isSuccess()).toBe(true);
        expect(result.getSuccess().lines).toHaveLength(2);
    });

    it('should remove line from order', () => {
        const command = new CreateOrderCommand(
            defaultParties(),
            [
                new OrderLineData("LAPTOP-DELL-5540", 1, "pieces", {}, null),
                new OrderLineData("MOUSE-LOGITECH-MX3", 2, "pieces", {}, null)
            ]
        );
        const created = facade.handleCreateOrder(command).getSuccess();
        const lineToRemove = created.lines[1].id;

        const result = facade.handleRemoveOrderLine(
            new RemoveOrderLineCommand(created.id, lineToRemove));

        expect(result.isSuccess()).toBe(true);
        expect(result.getSuccess().lines).toHaveLength(1);
        expect(result.getSuccess().lines[0].productId).toBe("LAPTOP-DELL-5540");
    });

    it('should change line quantity', () => {
        const created = facade.handleCreateOrder(simpleOrderCommand("SCREW-M6-50MM", 100, "pieces")).getSuccess();
        const lineId = created.lines[0].id;

        const result = facade.handleChangeOrderLineQuantity(
            new ChangeOrderLineQuantityCommand(created.id, lineId, 500, "pieces"));

        expect(result.isSuccess()).toBe(true);
        expect(result.getSuccess().lines[0].quantity).toContain("500");
    });

    it('should confirm draft order', () => {
        const created = facade.handleCreateOrder(simpleOrderCommand("APPLE-IPHONE-15-PRO", 1, "pieces")).getSuccess();

        const result = facade.handleConfirmOrder(new ConfirmOrderCommand(created.id));

        expect(result.isSuccess()).toBe(true);
        expect(result.getSuccess().status).toBe("CONFIRMED");
    });

    it('should cancel draft order', () => {
        const created = facade.handleCreateOrder(simpleOrderCommand("APPLE-IPHONE-15-PRO", 1, "pieces")).getSuccess();

        const result = facade.handleCancelOrder(new CancelOrderCommand(created.id, "Changed my mind"));

        expect(result.isSuccess()).toBe(true);
        expect(result.getSuccess().status).toBe("CANCELLED");
    });

    it('should cancel confirmed order', () => {
        const created = facade.handleCreateOrder(simpleOrderCommand("APPLE-IPHONE-15-PRO", 1, "pieces")).getSuccess();
        facade.handleConfirmOrder(new ConfirmOrderCommand(created.id));

        const result = facade.handleCancelOrder(new CancelOrderCommand(created.id, "Customer request"));

        expect(result.isSuccess()).toBe(true);
        expect(result.getSuccess().status).toBe("CANCELLED");
    });

    it('should fail to add line to confirmed order', () => {
        const created = facade.handleCreateOrder(simpleOrderCommand("APPLE-IPHONE-15-PRO", 1, "pieces")).getSuccess();
        facade.handleConfirmOrder(new ConfirmOrderCommand(created.id));

        const result = facade.handleAddOrderLine(
            new AddOrderLineCommand(created.id, "MOUSE-LOGITECH-MX3", 1, "pieces", {}));

        expect(result.isFailure()).toBe(true);
    });

    it('should fail to confirm already confirmed order', () => {
        const created = facade.handleCreateOrder(simpleOrderCommand("APPLE-IPHONE-15-PRO", 1, "pieces")).getSuccess();
        facade.handleConfirmOrder(new ConfirmOrderCommand(created.id));

        const result = facade.handleConfirmOrder(new ConfirmOrderCommand(created.id));

        expect(result.isFailure()).toBe(true);
    });

    it('should fail to create order without lines', () => {
        const command = new CreateOrderCommand(defaultParties(), []);

        const result = facade.handleCreateOrder(command);

        expect(result.isFailure()).toBe(true);
    });

    it('should fail to create order with invalid roles', () => {
        const command = new CreateOrderCommand(
            [new OrderPartyData(
                "customer-123", "John Doe", "john@example.com",
                new Set(["ORDERER", "PAYER", "RECEIVER"]))],
            [new OrderLineData("LAPTOP", 1, "pieces", {}, null)]
        );

        const result = facade.handleCreateOrder(command);

        expect(result.isFailure()).toBe(true);
    });

    it('should fail to remove last line', () => {
        const created = facade.handleCreateOrder(simpleOrderCommand("LAPTOP-DELL-5540", 1, "pieces")).getSuccess();
        const lineId = created.lines[0].id;

        const result = facade.handleRemoveOrderLine(new RemoveOrderLineCommand(created.id, lineId));

        expect(result.isFailure()).toBe(true);
    });

    it('should find order by id', () => {
        const created = facade.handleCreateOrder(simpleOrderCommand("LAPTOP-DELL-5540", 1, "pieces")).getSuccess();

        const found = queries.findById(created.id);

        expect(found).not.toBeNull();
        expect(found!.id.value).toBe(created.id.value);
        expect(found!.status).toBe("DRAFT");
    });

    it('should find all orders', () => {
        const config2 = OrderingConfiguration.inMemory();
        const facade2 = config2.orderingFacade();
        const queries2 = config2.orderingQueries();

        facade2.handleCreateOrder(simpleOrderCommand2("LAPTOP-DELL-5540", 1, "pieces"));
        facade2.handleCreateOrder(simpleOrderCommand2("MOUSE-LOGITECH-MX3", 2, "pieces"));

        const all = queries2.findAll();

        expect(all).toHaveLength(2);
    });

    it('should confirm order with inventory and payment', () => {
        const config3 = OrderingConfiguration.inMemory();
        const facade3 = config3.orderingFacade();

        const created = facade3.handleCreateOrder(simpleOrderCommand3(config3, "LAPTOP-DELL-5540", 1, "pieces")).getSuccess();

        const result = facade3.handleConfirmOrder(new ConfirmOrderCommand(created.id));

        expect(result.isSuccess()).toBe(true);
        expect(result.getSuccess().status).toBe("CONFIRMED");
        expect(config3.inventoryService().allocateRequests()).toHaveLength(1);
        expect(config3.paymentService().authorizeRequests()).toHaveLength(1);
        expect(config3.fulfillmentService().startedOrders()).toHaveLength(1);
    });

    it('should cancel confirmed order with compensation', () => {
        const config4 = OrderingConfiguration.inMemory();
        const facade4 = config4.orderingFacade();

        const created = facade4.handleCreateOrder(simpleOrderCommand3(config4, "LAPTOP-DELL-5540", 1, "pieces")).getSuccess();
        facade4.handleConfirmOrder(new ConfirmOrderCommand(created.id));

        const result = facade4.handleCancelOrder(new CancelOrderCommand(created.id, "Customer changed mind"));

        expect(result.isSuccess()).toBe(true);
        expect(result.getSuccess().status).toBe("CANCELLED");
        expect(config4.fulfillmentService().cancelledOrders()).toHaveLength(1);
    });

    it('should handle fulfillment updated event', () => {
        const config5 = OrderingConfiguration.inMemory();
        const facade5 = config5.orderingFacade();

        const created = facade5.handleCreateOrder(simpleOrderCommand3(config5, "LAPTOP-DELL-5540", 1, "pieces")).getSuccess();
        facade5.handleConfirmOrder(new ConfirmOrderCommand(created.id));

        const result = facade5.handleFulfillmentUpdated(
            new FulfillmentUpdated(created.id, FulfillmentStatus.IN_PROGRESS, "Picking started", new Date()));

        expect(result.isSuccess()).toBe(true);
        expect(result.getSuccess().status).toBe("PROCESSING");
    });

    it('should handle full order lifecycle', () => {
        const config6 = OrderingConfiguration.inMemory();
        const facade6 = config6.orderingFacade();
        const queries6 = config6.orderingQueries();

        const created = facade6.handleCreateOrder(simpleOrderCommand3(config6, "LAPTOP-DELL-5540", 1, "pieces")).getSuccess();
        expect(created.status).toBe("DRAFT");

        facade6.handleConfirmOrder(new ConfirmOrderCommand(created.id));
        const confirmed = queries6.findById(created.id)!;
        expect(confirmed.status).toBe("CONFIRMED");

        facade6.handleFulfillmentUpdated(
            new FulfillmentUpdated(created.id, FulfillmentStatus.IN_PROGRESS, "Picking", new Date()));
        const processing = queries6.findById(created.id)!;
        expect(processing.status).toBe("PROCESSING");

        facade6.handleFulfillmentUpdated(
            new FulfillmentUpdated(created.id, FulfillmentStatus.COMPLETED, "Delivered", new Date()));
        const fulfilled = queries6.findById(created.id)!;
        expect(fulfilled.status).toBe("FULFILLED");
    });

    it('should fail to confirm when inventory unavailable', () => {
        const config7 = OrderingConfiguration.inMemory();
        const facade7 = config7.orderingFacade();
        const queries7 = config7.orderingQueries();

        config7.inventoryService().willFailOnAllocate();
        const created = facade7.handleCreateOrder(simpleOrderCommand3(config7, "LAPTOP-DELL-5540", 1, "pieces")).getSuccess();

        const result = facade7.handleConfirmOrder(new ConfirmOrderCommand(created.id));

        expect(result.isFailure()).toBe(true);
        const order = queries7.findById(created.id)!;
        expect(order.status).toBe("DRAFT");
    });

    it('should fail to confirm when payment fails', () => {
        const config8 = OrderingConfiguration.inMemory();
        const facade8 = config8.orderingFacade();
        const queries8 = config8.orderingQueries();

        config8.paymentService().willFailOnPayment("Insufficient funds");
        const created = facade8.handleCreateOrder(simpleOrderCommand3(config8, "LAPTOP-DELL-5540", 1, "pieces")).getSuccess();

        const result = facade8.handleConfirmOrder(new ConfirmOrderCommand(created.id));

        expect(result.isFailure()).toBe(true);
        const order = queries8.findById(created.id)!;
        expect(order.status).toBe("DRAFT");
    });

    it('should fail to handle fulfillment on draft order', () => {
        const created = facade.handleCreateOrder(simpleOrderCommand("LAPTOP-DELL-5540", 1, "pieces")).getSuccess();

        const result = facade.handleFulfillmentUpdated(
            new FulfillmentUpdated(created.id, FulfillmentStatus.IN_PROGRESS, "Picking", new Date()));

        expect(result.isFailure()).toBe(true);
    });

    // --- Helper methods ---

    function simpleOrderCommand(productId: string, quantity: number, unit: string): CreateOrderCommand {
        return new CreateOrderCommand(
            defaultParties(),
            [new OrderLineData(productId, quantity, unit, {}, null)]
        );
    }

    function simpleOrderCommand2(productId: string, quantity: number, unit: string): CreateOrderCommand {
        return new CreateOrderCommand(
            defaultParties(),
            [new OrderLineData(productId, quantity, unit, {}, null)]
        );
    }

    function simpleOrderCommand3(_config: OrderingConfiguration, productId: string, quantity: number, unit: string): CreateOrderCommand {
        return new CreateOrderCommand(
            defaultParties(),
            [new OrderLineData(productId, quantity, unit, {}, null)]
        );
    }

    function defaultParties(): OrderPartyData[] {
        return [
            new OrderPartyData("customer-123", "John Doe", "john@example.com",
                new Set(["ORDERER", "PAYER", "RECEIVER"])),
            new OrderPartyData("shop-warsaw", "Warsaw Shop", "warsaw@shop.com",
                new Set(["EXECUTOR"]))
        ];
    }
});
