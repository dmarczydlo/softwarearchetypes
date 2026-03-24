import { Quantity } from "@softwarearchetypes/quantity";
import { OfferItem } from "../../../offer/OfferItem";
import { OfferItemPredicate } from "../../ConfigurableItemModifier";

export class QuantityPredicate {
    private readonly _quantity: Quantity;

    constructor(quantity: Quantity) {
        this._quantity = quantity;
    }

    test: OfferItemPredicate = (_offerItem: OfferItem): boolean => {
        return false; // TODO comparator with units
    };

    getQuantity(): Quantity {
        return this._quantity;
    }
}
