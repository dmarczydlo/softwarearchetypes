import { Percentage } from "@softwarearchetypes/quantity";
import { OfferItemModifier } from "./OfferItemModifier";
import { ClientStatusVisitor } from "./client/ClientStatus";
import { PercentageOfferItemModifier } from "./offer/modifiers/simple/PercentageOfferItemModifier";

export class OfferItemModifierVisitor implements ClientStatusVisitor<OfferItemModifier> {
    visitStandard(): OfferItemModifier {
        return new PercentageOfferItemModifier("My friend", Percentage.ofFraction(0.05));
    }

    visitVIP(): OfferItemModifier {
        return new PercentageOfferItemModifier("VIP", Percentage.ofFraction(0.15));
    }

    visitGold(): OfferItemModifier {
        return new PercentageOfferItemModifier("Gold", Percentage.of(25));
    }
}
