import { describe, it, expect } from "vitest";
import { Money, Percentage, Quantity, Unit } from "@softwarearchetypes/quantity";
import { ChainOfferItemModifier } from "./offer/modifiers/ChainOfferItemModifier";
import { ConfigurableItemModifier } from "./offer/modifiers/ConfigurableItemModifier";
import { Amount } from "./offer/modifiers/functors/applier/Amount";
import { MarginGuardian } from "./offer/modifiers/functors/guardians/MarginGuardian";
import { MoreExpensiveThanPredicate } from "./offer/modifiers/functors/predicates/MoreExpensiveThanPredicate";
import { OfferItem } from "./offer/OfferItem";

function anyItemPriced(amount: number): OfferItem {
    return new OfferItem(crypto.randomUUID(), Quantity.of(1, Unit.kilograms()), Money.pln(amount));
}

describe("ChainOfferModifier", () => {
    it("should apply one modifier", () => {
        const modifier = new ChainOfferItemModifier();
        modifier.add(new ConfigurableItemModifier(
            "expensive line",
            new MoreExpensiveThanPredicate(Money.pln(1000)).test,
            new Amount(Money.pln(100)).apply,
            new MarginGuardian(Percentage.of(30)).test
        ));

        const item = modifier.modify(anyItemPriced(2000));
        expect(item.getFinalPrice().equals(anyItemPriced(1900).getFinalPrice())).toBe(true);
    });

    it("should not apply modifier when guardian prevents it", () => {
        const modifier = new ChainOfferItemModifier();
        modifier.add(new ConfigurableItemModifier(
            "expensive line",
            new MoreExpensiveThanPredicate(Money.pln(1000)).test,
            new Amount(Money.pln(900)).apply,
            new MarginGuardian(Percentage.of(60)).test
        ));

        const item = modifier.modify(anyItemPriced(2000));
        expect(item.getFinalPrice().equals(anyItemPriced(2000).getFinalPrice())).toBe(true);
    });
});
