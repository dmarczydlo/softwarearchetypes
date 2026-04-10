import { describe, it, expect } from 'vitest';
import { Money } from '@softwarearchetypes/quantity';
import { OrderingConfiguration } from './ordering-configuration.js';
import { OrderView } from './order-view.js';
import { CalculatedPricing } from './order-line-pricing.js';
import { PriceBreakdown } from './price-breakdown.js';
import { ProductIdentifier } from './product-identifier.js';
import { AllocationStatus } from './inventory-service.js';
import { CreateOrderCommand, OrderPartyData, OrderLineData } from './commands/create-order-command.js';
import { PriceOrderCommand } from './commands/price-order-command.js';
import { SetArbitraryLinePriceCommand } from './commands/set-arbitrary-line-price-command.js';
import { ChangeOrderLineQuantityCommand } from './commands/change-order-line-quantity-command.js';
import { ConfirmOrderCommand } from './commands/confirm-order-command.js';

describe('PricingScenarios', () => {
    it('should not have price when order line is created', () => {
        const config = OrderingConfiguration.inMemory();
        const facade = config.orderingFacade();

        const order = createSingleLineOrder(config, "PHONE-1", 2);

        expect(order.lines[0].pricingType).toBe("NotPricedYet");
        expect(order.lines[0].unitPrice).toBeNull();
        expect(order.lines[0].totalPrice).toBeNull();
        expect(order.lines[0].breakdown).toHaveLength(0);
        expect(order.totalPrice).toBeNull();
    });

    it('should calculate pricing for all lines when price order is handled', () => {
        const config = OrderingConfiguration.inMemory();
        const facade = config.orderingFacade();
        const pricingService = config.pricingService();

        const order = createTwoLineOrder(config);
        pricingService.willCalculate(Money.pln(100), Money.pln(200));

        const result = facade.handlePriceOrder(new PriceOrderCommand(order.id));

        expect(result.success()).toBe(true);
        const priced = result.getSuccess();
        expect(priced.lines[0].pricingType).toBe("CalculatedPricing");
        expect(priced.lines[0].unitPrice).toBe("PLN 100");
        expect(priced.lines[0].totalPrice).toBe("PLN 200");
        expect(priced.lines[1].pricingType).toBe("CalculatedPricing");
        expect(priced.lines[1].unitPrice).toBe("PLN 100");
        expect(priced.lines[1].totalPrice).toBe("PLN 200");
        expect(priced.totalPrice).toBe("PLN 400");
    });

    it('should send productId and quantity in pricing context', () => {
        const config = OrderingConfiguration.inMemory();
        const facade = config.orderingFacade();
        const pricingService = config.pricingService();

        const order = createSingleLineOrder(config, "LAPTOP-1", 3);
        pricingService.willCalculate(Money.pln(3000), Money.pln(9000));

        facade.handlePriceOrder(new PriceOrderCommand(order.id));

        expect(pricingService.calculateRequests()).toHaveLength(1);
        const ctx = pricingService.calculateRequests()[0];
        expect(ctx.productId.value).toBe("LAPTOP-1");
        expect(ctx.quantity).not.toBeNull();
        expect(ctx.parties).not.toBeNull();
        expect(ctx.specification).not.toBeNull();
        expect(ctx.pricingTime).not.toBeNull();
    });

    it('should apply different prices per line', () => {
        const config = OrderingConfiguration.inMemory();
        const facade = config.orderingFacade();
        const pricingService = config.pricingService();

        const order = createTwoLineOrder(config);
        pricingService.willAnswer(ctx => {
            if (ctx.productId.value === "PHONE-1") {
                return new CalculatedPricing(Money.pln(1000), Money.pln(2000));
            } else {
                return new CalculatedPricing(Money.pln(50), Money.pln(150));
            }
        });

        const result = facade.handlePriceOrder(new PriceOrderCommand(order.id));

        expect(result.success()).toBe(true);
        const priced = result.getSuccess();
        expect(priced.lines[0].unitPrice).toBe("PLN 1000");
        expect(priced.lines[0].totalPrice).toBe("PLN 2000");
        expect(priced.lines[1].unitPrice).toBe("PLN 50");
        expect(priced.lines[1].totalPrice).toBe("PLN 150");
        expect(priced.totalPrice).toBe("PLN 2150");
    });

    it('should set arbitrary price on order line', () => {
        const config = OrderingConfiguration.inMemory();
        const facade = config.orderingFacade();

        const order = createSingleLineOrder(config, "CUSTOM-1", 1);
        const lineId = order.lines[0].id;

        const result = facade.handleSetArbitraryLinePrice(new SetArbitraryLinePriceCommand(
            order.id, lineId,
            99.99, 99.99,
            "PLN", "Manager override"
        ));

        expect(result.success()).toBe(true);
        const updated = result.getSuccess();
        expect(updated.lines[0].pricingType).toBe("ArbitraryPricing");
        expect(updated.lines[0].unitPrice).toBe("PLN 99.99");
        expect(updated.lines[0].totalPrice).toBe("PLN 99.99");
        expect(updated.lines[0].breakdown).toHaveLength(0);
    });

    it('should not be definitive when estimated pricing is applied', () => {
        const config = OrderingConfiguration.inMemory();
        const facade = config.orderingFacade();
        const pricingService = config.pricingService();

        const order = createSingleLineOrder(config, "SERVICE-1", 1);
        pricingService.willEstimate(Money.pln(500), Money.pln(500));

        const result = facade.handlePriceOrder(new PriceOrderCommand(order.id));

        expect(result.success()).toBe(true);
        expect(result.getSuccess().lines[0].pricingType).toBe("EstimatedPricing");
        expect(result.getSuccess().lines[0].unitPrice).toBe("PLN 500");
        expect(result.getSuccess().lines[0].totalPrice).toBe("PLN 500");
    });

    it('should reset pricing to not priced yet when quantity changes', () => {
        const config = OrderingConfiguration.inMemory();
        const facade = config.orderingFacade();
        const pricingService = config.pricingService();

        const order = createSingleLineOrder(config, "PHONE-1", 2);
        const lineId = order.lines[0].id;
        pricingService.willCalculate(Money.pln(1000), Money.pln(2000));
        facade.handlePriceOrder(new PriceOrderCommand(order.id));

        const result = facade.handleChangeOrderLineQuantity(
            new ChangeOrderLineQuantityCommand(order.id, lineId, 5, "pcs"));

        expect(result.success()).toBe(true);
        expect(result.getSuccess().lines[0].pricingType).toBe("NotPricedYet");
        expect(result.getSuccess().lines[0].unitPrice).toBeNull();
        expect(result.getSuccess().totalPrice).toBeNull();
    });

    it('should confirm priced order', () => {
        const config = OrderingConfiguration.inMemory();
        const facade = config.orderingFacade();
        const pricingService = config.pricingService();

        const order = createSingleLineOrder(config, "PHONE-1", 2);
        pricingService.willCalculate(Money.pln(1000), Money.pln(2000));
        facade.handlePriceOrder(new PriceOrderCommand(order.id));
        config.inventoryService().willReturnOnAllocate(AllocationStatus.ALLOCATED);

        const confirmResult = facade.handleConfirmOrder(new ConfirmOrderCommand(order.id));

        expect(confirmResult.success()).toBe(true);
        expect(confirmResult.getSuccess().status).toBe("CONFIRMED");
        expect(confirmResult.getSuccess().totalPrice).toBe("PLN 2000");
    });

    it('should preserve breakdown components after pricing', () => {
        const config = OrderingConfiguration.inMemory();
        const facade = config.orderingFacade();
        const pricingService = config.pricingService();

        const order = createSingleLineOrder(config, "BUNDLE-1", 1);
        pricingService.willCalculateWithBreakdown(
            Money.pln(300), Money.pln(300),
            [
                new PriceBreakdown("base", Money.pln(250)),
                new PriceBreakdown("warranty", Money.pln(50))
            ]
        );

        const result = facade.handlePriceOrder(new PriceOrderCommand(order.id));

        expect(result.success()).toBe(true);
        const line = result.getSuccess().lines[0];
        expect(line.pricingType).toBe("CalculatedPricing");
        expect(line.totalPrice).toBe("PLN 300");
        expect(line.breakdown).toHaveLength(2);
        expect(line.breakdown[0].componentName).toBe("base");
        expect(line.breakdown[0].amount).toBe("PLN 250");
        expect(line.breakdown[1].componentName).toBe("warranty");
        expect(line.breakdown[1].amount).toBe("PLN 50");
    });

    it('should call pricing service once per line', () => {
        const config = OrderingConfiguration.inMemory();
        const facade = config.orderingFacade();
        const pricingService = config.pricingService();

        const order = createTwoLineOrder(config);
        pricingService.willCalculate(Money.pln(100), Money.pln(200));

        facade.handlePriceOrder(new PriceOrderCommand(order.id));

        expect(pricingService.calculateRequests()).toHaveLength(2);
        expect(pricingService.calculateRequests()[0].productId.value).toBe("PHONE-1");
        expect(pricingService.calculateRequests()[1].productId.value).toBe("MOUSE-1");
    });

    function createSingleLineOrder(config: OrderingConfiguration, productId: string, quantity: number): OrderView {
        const result = config.orderingFacade().handleCreateOrder(new CreateOrderCommand(
            [
                new OrderPartyData("customer-1", "Customer", "c@test.com",
                    new Set(["ORDERER", "PAYER", "RECEIVER"])),
                new OrderPartyData("executor-1", "Executor", "",
                    new Set(["EXECUTOR"]))
            ],
            [new OrderLineData(productId, quantity, "pcs", {}, [])]
        ));
        expect(result.success()).toBe(true);
        return result.getSuccess();
    }

    function createTwoLineOrder(config: OrderingConfiguration): OrderView {
        const result = config.orderingFacade().handleCreateOrder(new CreateOrderCommand(
            [
                new OrderPartyData("customer-1", "Customer", "c@test.com",
                    new Set(["ORDERER", "PAYER", "RECEIVER"])),
                new OrderPartyData("executor-1", "Executor", "",
                    new Set(["EXECUTOR"]))
            ],
            [
                new OrderLineData("PHONE-1", 2, "pcs", {}, []),
                new OrderLineData("MOUSE-1", 3, "pcs", {}, [])
            ]
        ));
        expect(result.success()).toBe(true);
        return result.getSuccess();
    }
});
