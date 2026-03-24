import { OfferItemModifier } from "../OfferItemModifier";
import { ClientContext } from "../client/ClientContext";

export type ClientPredicate = (client: ClientContext) => boolean;

export interface ConfigProvider {
    loadConfig(): Map<OfferItemModifier, ClientPredicate>;
}
