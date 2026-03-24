import { Money } from "@softwarearchetypes/quantity";
import { OfferItem } from "../../../offer/OfferItem";
import { OfferItemApplier } from "../../ConfigurableItemModifier";

export class Amount {
    private readonly _amount: Money;

    constructor(amount: Money) {
        this._amount = amount;
    }

    apply: OfferItemApplier = (offerItem: OfferItem): Money => {
        return offerItem.getFinalPrice().subtract(this._amount);
    };

    getAmount(): Money {
        return this._amount;
    }
}
