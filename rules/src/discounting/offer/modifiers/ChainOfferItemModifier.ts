import { OfferItemModifier } from "../../OfferItemModifier";
import { OfferItem } from "../OfferItem";

export class ChainOfferItemModifier implements OfferItemModifier {
    private readonly modifiers: OfferItemModifier[] = [];

    modify(item: OfferItem): OfferItem {
        let result = item;
        for (const modifier of this.modifiers) {
            result = modifier.modify(result);
        }
        return result;
    }

    add(modifier: OfferItemModifier): ChainOfferItemModifier {
        this.modifiers.push(modifier);
        return this;
    }
}
