import { Percentage } from "@softwarearchetypes/quantity";
import { NamedOfferItemModifier } from "../NamedOfferItemModifier";
import { Modification } from "../../Modification";
import { OfferItem } from "../../OfferItem";

export class PercentageOfferItemModifier extends NamedOfferItemModifier {
    private readonly _percentage: Percentage;

    constructor(name: string, percentage: Percentage) {
        super(name);
        this._percentage = percentage;
    }

    modify(item: OfferItem): OfferItem {
        const modification = item.getBasePrice().multiply(this._percentage);
        const newPrice = item.getBasePrice().subtract(modification);
        const description = `${this.getName()} (${this._percentage}%)`;

        return item.apply(new Modification(newPrice, description));
    }
}
