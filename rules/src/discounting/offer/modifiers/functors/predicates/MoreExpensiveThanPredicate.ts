import { Money } from "@softwarearchetypes/quantity";
import { OfferItem } from "../../../offer/OfferItem";
import { OfferItemPredicate } from "../../ConfigurableItemModifier";

export class MoreExpensiveThanPredicate {
    private readonly _amount: Money;

    constructor(amount: Money) {
        this._amount = amount;
    }

    test: OfferItemPredicate = (offerItem: OfferItem): boolean => {
        return offerItem.getBasePrice().isGreaterThanOrEqualTo(this._amount);
    };

    getAmount(): Money {
        return this._amount;
    }
}
