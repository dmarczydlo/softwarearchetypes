import { OfferItem } from "../../../offer/OfferItem";
import { OfferItemPredicate } from "../../ConfigurableItemModifier";

export class ItemIdPredicate {
    private readonly _productId: string;

    constructor(productId: string) {
        this._productId = productId;
    }

    test: OfferItemPredicate = (offerItem: OfferItem): boolean => {
        return offerItem.getProductId() === this._productId;
    };

    getProductId(): string {
        return this._productId;
    }
}
