import { describe, it, expect } from "vitest";
import { Money, Quantity, Unit } from "@softwarearchetypes/quantity";
import { OfferItemModifierFactory } from "./OfferItemModifierFactory";
import { ClientContext } from "./client/ClientContext";
import { ClientContextRepository } from "./client/ClientContextRepository";
import { ClientStatus } from "./client/ClientStatus";
import { SampleStaticConfig } from "./config/SampleStaticConfig";
import { OfferItem } from "./offer/OfferItem";

function anyItemPriced(amount: number): OfferItem {
    return new OfferItem(crypto.randomUUID(), Quantity.of(1, Unit.kilograms()), Money.pln(amount));
}

describe("OfferItemModifierFactory", () => {
    const clientContextRepository: ClientContextRepository = {
        loadClientContext(clientId: string): ClientContext {
            return new ClientContext(clientId, ClientStatus.VIP, Money.pln(1000000), new Date(2020, 0, 1));
        }
    };

    it("should apply VIP discount via visitor", () => {
        const item = anyItemPriced(100);
        const modified = new OfferItemModifierFactory(null, null)
            .createDiscountModifier2(ClientStatus.VIP)
            .modify(item);
        expect(modified.getFinalPrice().equals(anyItemPriced(85).getFinalPrice())).toBe(true);
    });

    it("should apply config-based discount", () => {
        const factory = new OfferItemModifierFactory(clientContextRepository, new SampleStaticConfig());
        const modifier = factory.createDiscountModifier3(crypto.randomUUID());
        const modified = modifier.modify(anyItemPriced(100));
        expect(modified.getFinalPrice().equals(anyItemPriced(80).getFinalPrice())).toBe(true);
    });
});
