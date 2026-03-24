import { Money } from "@softwarearchetypes/quantity";
import { NamedOfferItemModifier } from "./NamedOfferItemModifier";
import { OfferItem } from "../OfferItem";
import { Modification } from "../Modification";

export type OfferItemPredicate = (item: OfferItem) => boolean;
export type OfferItemApplier = (item: OfferItem) => Money;

export class ConfigurableItemModifier extends NamedOfferItemModifier {
    private readonly _predicate: OfferItemPredicate;
    private readonly _applier: OfferItemApplier;
    private readonly _guardian: OfferItemPredicate;

    constructor(
        name: string,
        predicate: OfferItemPredicate,
        applier: OfferItemApplier,
        guardian: OfferItemPredicate
    ) {
        super(name);
        this._predicate = predicate;
        this._applier = applier;
        this._guardian = guardian;
    }

    modify(item: OfferItem): OfferItem {
        if (this._predicate(item)) {
            const applied = this._applier(item);
            if (!applied.equals(item.getFinalPrice())) {
                const newItem = item.apply(new Modification(applied, this.getName()));
                if (this._guardian(newItem)) {
                    return newItem;
                }
            }
        }
        return item; // unchanged
    }

    getApplier(): OfferItemApplier {
        return this._applier;
    }

    getGuardian(): OfferItemPredicate {
        return this._guardian;
    }

    getPredicate(): OfferItemPredicate {
        return this._predicate;
    }
}
