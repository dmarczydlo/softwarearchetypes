import { Money, Percentage } from "@softwarearchetypes/quantity";
import { OfferItemModifier } from "../OfferItemModifier";
import { ClientStatus } from "../client/ClientStatus";
import { ExpensesRule } from "../client/rules/ExpensesRule";
import { StatusRule } from "../client/rules/StatusRule";
import { TimeBeingCustomer } from "../client/rules/TimeBeingCustomer";
import { ConfigurableItemModifier } from "../offer/modifiers/ConfigurableItemModifier";
import { PercentageFromBase } from "../offer/modifiers/functors/applier/PercentageFromBase";
import { EmptyGuardian } from "../offer/modifiers/functors/guardians/EmptyGuardian";
import { MoreExpensiveThanPredicate } from "../offer/modifiers/functors/predicates/MoreExpensiveThanPredicate";
import { ConfigProvider, ClientPredicate } from "./ConfigProvider";

export class SampleStaticConfig implements ConfigProvider {
    loadConfig(): Map<OfferItemModifier, ClientPredicate> {
        const configuration = new Map<OfferItemModifier, ClientPredicate>();

        const mod1 = new ConfigurableItemModifier(
            "3 years of VIPs",
            new MoreExpensiveThanPredicate(Money.pln(50)).test,
            new PercentageFromBase(Percentage.of(10)).apply,
            EmptyGuardian.INSTANCE.test
        );
        const pred1 = StatusRule.of(ClientStatus.VIP).and(TimeBeingCustomer.ofYears(3));
        configuration.set(mod1, (client) => pred1.test(client));

        const mod2 = new ConfigurableItemModifier(
            "VIPs - big fish",
            new MoreExpensiveThanPredicate(Money.pln(100)).test,
            new PercentageFromBase(Percentage.of(10)).apply,
            EmptyGuardian.INSTANCE.test
        );
        const pred2 = StatusRule.of(ClientStatus.VIP).and(ExpensesRule.of(Money.pln(500000)));
        configuration.set(mod2, (client) => pred2.test(client));

        return configuration;
    }
}
