import { Money, Percentage, Quantity } from "@softwarearchetypes/quantity";
import { OfferItemModifier } from "../OfferItemModifier";
import { ClientFinder } from "../client/ClientFinder";
import { ClientStatus } from "../client/ClientStatus";
import { ExpensesRule } from "../client/rules/ExpensesRule";
import { StatusRule } from "../client/rules/StatusRule";
import { TimeBeingCustomer } from "../client/rules/TimeBeingCustomer";
import { ConfigurableItemModifier } from "../offer/modifiers/ConfigurableItemModifier";
import { PercentageFromBase } from "../offer/modifiers/functors/applier/PercentageFromBase";
import { EmptyGuardian } from "../offer/modifiers/functors/guardians/EmptyGuardian";
import { ItemIdPredicate } from "../offer/modifiers/functors/predicates/ItemIdPredicate";
import { MoreExpensiveThanPredicate } from "../offer/modifiers/functors/predicates/MoreExpensiveThanPredicate";
import { InventoryFinder } from "../stock/InventoryFinder";
import { ProductStock } from "../stock/ProductStock";
import { ConfigProvider, ClientPredicate } from "./ConfigProvider";

export class SampleDynamicConfig implements ConfigProvider {
    private readonly inventoryFinder: InventoryFinder;
    private readonly clientFinder: ClientFinder;

    constructor(inventoryFinder: InventoryFinder, clientFinder: ClientFinder) {
        this.inventoryFinder = inventoryFinder;
        this.clientFinder = clientFinder;
    }

    loadConfig(): Map<OfferItemModifier, ClientPredicate> {
        const configuration = new Map<OfferItemModifier, ClientPredicate>();

        for (const stock of this.inventoryFinder.findOverstockedProducts()) {
            const discount = this.calculateDiscountFor(stock);

            const overstockModifier = new ConfigurableItemModifier(
                "Overstock promo for " + stock.productId,
                new ItemIdPredicate(stock.productId).test,
                new PercentageFromBase(discount).apply,
                EmptyGuardian.INSTANCE.test
            );

            const appliesToEveryone: ClientPredicate = (_client) => true;
            configuration.set(overstockModifier, appliesToEveryone);
        }

        const vipCount = this.clientFinder.countVipClients();
        const allCount = this.clientFinder.countAllClients();
        const vipRatio = allCount === 0 ? 0.0 : vipCount / allCount;

        if (vipRatio < 0.05) {
            const growVipBaseModifier = new ConfigurableItemModifier(
                "Grow VIP base - strong promo",
                new MoreExpensiveThanPredicate(Money.pln(50)).test,
                new PercentageFromBase(Percentage.of(20)).apply,
                EmptyGuardian.INSTANCE.test
            );

            const targetRegularsWithPotential = StatusRule.of(ClientStatus.STANDARD)
                .and(ExpensesRule.of(Money.pln(1000)));

            configuration.set(growVipBaseModifier, (client) => targetRegularsWithPotential.test(client));
        } else {
            const vipRetentionModifier = new ConfigurableItemModifier(
                "VIP retention promo",
                new MoreExpensiveThanPredicate(Money.pln(100)).test,
                new PercentageFromBase(Percentage.of(10)).apply,
                EmptyGuardian.INSTANCE.test
            );

            const oldVipClients = StatusRule.of(ClientStatus.VIP)
                .and(TimeBeingCustomer.ofYears(3));

            configuration.set(vipRetentionModifier, (client) => oldVipClients.test(client));
        }

        return configuration;
    }

    private calculateDiscountFor(stock: ProductStock): Percentage {
        const base = 5;
        const extraFromQuantity = stock.quantity.amount > 500 ? 10 : stock.quantity.amount > 200 ? 5 : 0;
        const extraFromDays = stock.daysInStock > 90 ? 10 : stock.daysInStock > 30 ? 5 : 0;

        const total = Math.min(30, base + extraFromQuantity + extraFromDays); // max 30%
        return Percentage.of(total);
    }
}
