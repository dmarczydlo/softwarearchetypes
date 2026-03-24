import { describe, it, expect } from 'vitest';
import { OrderingConfiguration } from './ordering-configuration.js';
import { CreateOrderCommand, OrderPartyData, OrderLineData } from './commands/create-order-command.js';

describe('OrderWithLineLevelPartiesScenarios', () => {
    it('order with different receivers per line', () => {
        const configuration = OrderingConfiguration.inMemory();
        const facade = configuration.orderingFacade();

        // when
        const order = facade.handleCreateOrder(new CreateOrderCommand(
            [
                new OrderPartyData("company-abc", "ABC Corp", "abc@corp.com",
                    new Set(["ORDERER", "PAYER", "RECEIVER"])),
                new OrderPartyData("it-supplier", "IT Supplies", "it@supplies.com",
                    new Set(["EXECUTOR"]))
            ],
            [
                new OrderLineData("LAPTOP-DELL-5540", 5, "pieces",
                    { "ram": "16GB" },
                    [new OrderPartyData(
                        "branch-warsaw", "Warsaw Branch", "warsaw@abc.com",
                        new Set(["RECEIVER"]))]),
                new OrderLineData("MONITOR-LG-27UK850", 5, "pieces",
                    { "resolution": "4K" },
                    [new OrderPartyData(
                        "branch-cracow", "Cracow Branch", "cracow@abc.com",
                        new Set(["RECEIVER"]))])
            ]
        )).getSuccess();

        // then
        expect(order.lines).toHaveLength(2);

        const line1 = order.lines[0];
        expect(line1.parties).toHaveLength(1);
        expect(line1.parties[0].partyId).toBe("branch-warsaw");
        expect(line1.parties[0].roles.has("RECEIVER")).toBe(true);

        const line2 = order.lines[1];
        expect(line2.parties).toHaveLength(1);
        expect(line2.parties[0].partyId).toBe("branch-cracow");
        expect(line2.parties[0].roles.has("RECEIVER")).toBe(true);

        expect(order.parties).toHaveLength(2);
    });
});
