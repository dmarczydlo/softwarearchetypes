import { Percentage } from "@softwarearchetypes/quantity";
import { OfferItemModifier } from "./OfferItemModifier";
import { ClientContext } from "./client/ClientContext";
import { ClientContextRepository } from "./client/ClientContextRepository";
import { ClientStatus, acceptClientStatus } from "./client/ClientStatus";
import { ConfigProvider, ClientPredicate } from "./config/ConfigProvider";
import { ChainOfferItemModifier } from "./offer/modifiers/ChainOfferItemModifier";
import { EmptyModifier } from "./offer/modifiers/EmptyModifier";
import { PercentageOfferItemModifier } from "./offer/modifiers/simple/PercentageOfferItemModifier";
import { OfferItemModifierVisitor } from "./OfferItemModifierVisitor";

export class OfferItemModifierFactory {
    private readonly clientContextRepository: ClientContextRepository | null;
    private readonly configProvider: ConfigProvider | null;

    constructor(clientContextRepository: ClientContextRepository | null, configProvider: ConfigProvider | null) {
        this.clientContextRepository = clientContextRepository;
        this.configProvider = configProvider;
    }

    createDiscountModifier(status: ClientStatus): OfferItemModifier {
        switch (status) {
            case ClientStatus.STANDARD:
                return new PercentageOfferItemModifier("My friend", Percentage.ofFraction(0.05));
            case ClientStatus.VIP:
                return new PercentageOfferItemModifier("VIP", Percentage.ofFraction(0.15));
            case ClientStatus.GOLD:
                return new PercentageOfferItemModifier("Gold", Percentage.of(25));
            default:
                return new EmptyModifier();
        }
    }

    createDiscountModifier2(status: ClientStatus): OfferItemModifier {
        return acceptClientStatus(status, new OfferItemModifierVisitor());
    }

    createDiscountModifier3(clientId: string): OfferItemModifier {
        const configuration = this.configProvider!.loadConfig();
        const clientContext = this.clientContextRepository!.loadClientContext(clientId);
        const modifier = new ChainOfferItemModifier();

        for (const [mod, predicate] of configuration) {
            if (predicate(clientContext)) {
                modifier.add(mod);
            }
        }

        return modifier;
    }
}
