import { OfferItemModifier } from "../../OfferItemModifier";
import { OfferItem } from "../OfferItem";

export class EmptyModifier implements OfferItemModifier {
    modify(item: OfferItem): OfferItem {
        return item;
    }
}
