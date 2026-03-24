import { OfferItemModifier } from "../../OfferItemModifier";
import { OfferItem } from "../OfferItem";

export abstract class NamedOfferItemModifier implements OfferItemModifier {
    private readonly _name: string;

    constructor(name: string) {
        this._name = name;
    }

    getName(): string {
        return this._name;
    }

    abstract modify(item: OfferItem): OfferItem;
}
