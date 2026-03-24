import { Money, Percentage } from "@softwarearchetypes/quantity";
import { OfferItem } from "../../../offer/OfferItem";
import { OfferItemApplier } from "../../ConfigurableItemModifier";

export class PercentageFromBase {
    private readonly _percentage: Percentage;

    constructor(percentage: Percentage) {
        this._percentage = percentage;
    }

    apply: OfferItemApplier = (offerItem: OfferItem): Money => {
        const mod = offerItem.getBasePrice().multiply(this._percentage);
        return offerItem.getFinalPrice().subtract(mod);
    };

    getPercentage(): Percentage {
        return this._percentage;
    }
}
