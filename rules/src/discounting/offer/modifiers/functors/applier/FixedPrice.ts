import { Money } from "@softwarearchetypes/quantity";
import { OfferItem } from "../../../offer/OfferItem";
import { OfferItemApplier } from "../../ConfigurableItemModifier";

export class FixedPrice {
    private readonly _amount: Money;

    constructor(amount: Money) {
        this._amount = amount;
    }

    apply: OfferItemApplier = (_offerItem: OfferItem): Money => {
        return this._amount;
    };

    getAmount(): Money {
        return this._amount;
    }
}
