import { Percentage } from "@softwarearchetypes/quantity";
import { OfferItem } from "../../../offer/OfferItem";
import { OfferItemPredicate } from "../../ConfigurableItemModifier";

export class MarginGuardian {
    private readonly _minMargin: Percentage;

    constructor(minMargin: Percentage) {
        this._minMargin = minMargin;
    }

    test: OfferItemPredicate = (offerItem: OfferItem): boolean => {
        const threshold = offerItem.getBasePrice().multiply(this._minMargin);
        return offerItem.getFinalPrice().isGreaterThanOrEqualTo(threshold);
    };

    getMinMargin(): Percentage {
        return this._minMargin;
    }
}
