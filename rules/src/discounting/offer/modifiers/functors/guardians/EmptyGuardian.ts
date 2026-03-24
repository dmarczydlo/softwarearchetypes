import { OfferItem } from "../../../offer/OfferItem";
import { OfferItemPredicate } from "../../ConfigurableItemModifier";

export class EmptyGuardian {
    static readonly INSTANCE = new EmptyGuardian();

    test: OfferItemPredicate = (_offerItem: OfferItem): boolean => {
        return true;
    };
}
