import { OfferItem } from "./offer/OfferItem";

export interface OfferItemModifier {
    modify(item: OfferItem): OfferItem;
}
