import { describe, it, expect } from 'vitest';
import { OrderingConfiguration } from './ordering-configuration.js';
import { CreateOrderCommand, OrderPartyData, OrderLineData } from './commands/create-order-command.js';
import { ConfirmOrderCommand } from './commands/confirm-order-command.js';
import { CancelOrderCommand } from './commands/cancel-order-command.js';

describe('CorporateOrderScenarios', () => {
    it('corporate order with cancellation', () => {
        const configuration = OrderingConfiguration.inMemory();
        const facade = configuration.orderingFacade();

        // given
        let order = facade.handleCreateOrder(new CreateOrderCommand(
            [
                new OrderPartyData("company-abc", "ABC Corporation", "orders@abc.com",
                    new Set(["ORDERER", "PAYER"])),
                new OrderPartyData("it-supplier", "IT Supplies Ltd", "sales@it-supplies.com",
                    new Set(["EXECUTOR"])),
                new OrderPartyData("branch-warsaw", "ABC Warsaw Branch", "warsaw@abc.com",
                    new Set(["RECEIVER"]))
            ],
            [
                new OrderLineData("LAPTOP-DELL-5540", 10, "pieces",
                    { "ram": "32GB", "ssd": "1TB" }, null),
                new OrderLineData("MONITOR-LG-27UK850", 10, "pieces",
                    { "size": "27inch", "resolution": "4K" }, null),
                new OrderLineData("DOCKING-STATION-TB3", 10, "pieces",
                    {}, null)
            ]
        )).getSuccess();

        expect(order.status).toBe("DRAFT");
        expect(order.lines).toHaveLength(3);
        expect(order.parties).toHaveLength(3);
        expect(order.parties.some(p =>
            p.partyId === "company-abc" && p.roles.has("ORDERER") && p.roles.has("PAYER"))).toBe(true);
        expect(order.parties.some(p =>
            p.partyId === "branch-warsaw" && p.roles.has("RECEIVER"))).toBe(true);

        order = facade.handleConfirmOrder(new ConfirmOrderCommand(order.id)).getSuccess();
        expect(order.status).toBe("CONFIRMED");

        // when
        const cancelResult = facade.handleCancelOrder(
            new CancelOrderCommand(order.id, "Budget reallocation"));

        // then
        expect(cancelResult.isSuccess()).toBe(true);
        expect(cancelResult.getSuccess().status).toBe("CANCELLED");
        expect(configuration.fulfillmentService().cancelledOrders()).toHaveLength(1);
        expect(configuration.fulfillmentService().cancelledOrders()[0].value).toBe(order.id.value);
    });
});
