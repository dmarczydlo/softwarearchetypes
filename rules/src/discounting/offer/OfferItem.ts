import { Quantity, Money } from "@softwarearchetypes/quantity";
import { Modification } from "./Modification";

export class OfferItem {
    private readonly _productId: string;
    private readonly _quantity: Quantity;
    private readonly _basePrice: Money;
    private readonly _finalPrice: Money;
    private readonly _modifications: readonly Modification[];

    constructor(productId: string, quantity: Quantity, basePrice: Money, finalPrice?: Money, modifications?: Modification[]) {
        this._productId = productId;
        this._quantity = quantity;
        this._basePrice = basePrice;
        this._finalPrice = finalPrice ?? basePrice;
        this._modifications = modifications ? Object.freeze([...modifications]) : [];
    }

    apply(modification: Modification): OfferItem {
        const newPrice = modification.amount;
        const newModifications = [...this._modifications, modification];
        return new OfferItem(this._productId, this._quantity, this._basePrice, newPrice, newModifications);
    }

    getBasePrice(): Money {
        return this._basePrice;
    }

    getFinalPrice(): Money {
        return this._finalPrice;
    }

    getQuantity(): Quantity {
        return this._quantity;
    }

    getProductId(): string {
        return this._productId;
    }

    toString(): string {
        return `OfferItem{basePrice=${this._basePrice}, finalPrice=${this._finalPrice}}`;
    }
}
