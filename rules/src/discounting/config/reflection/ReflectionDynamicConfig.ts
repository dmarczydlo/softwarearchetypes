import { OfferItemModifier } from "../../OfferItemModifier";
import { ClientContext } from "../../client/ClientContext";
import { ConfigProvider, ClientPredicate } from "../ConfigProvider";
import { DiscountRepository } from "../DiscountRepository";
import { Config } from "./Config";
import { DiscountParam } from "./DiscountParam";
import { ReflectionBeanReader } from "./ReflectionBeanReader";
import { LogicalPredicate } from "../../../predicates/LogicalPredicate";

export class ReflectionDynamicConfig implements ConfigProvider {
    private readonly repository: DiscountRepository;

    constructor(repository: DiscountRepository) {
        this.repository = repository;
    }

    loadConfig(): Map<OfferItemModifier, ClientPredicate> {
        const config = new Map<OfferItemModifier, ClientPredicate>();

        for (const discount of this.repository.findAllDiscounts()) {
            const paramsList = this.repository.findParamsByDiscountId(discount.id!);
            const params = this.toParamMap(paramsList);

            const beanReader = new ReflectionBeanReader(params);

            const modifier = beanReader.readBean<OfferItemModifier>(Config.MODIFIER_PREFIX);

            const clientPredicate = beanReader.readLogicalPredicate(Config.CLIENT_PREDICATE_PREFIX);

            const predicate: ClientPredicate = (client: ClientContext) => {
                if (clientPredicate === null) return true;
                return (clientPredicate as LogicalPredicate<ClientContext>).test(client);
            };

            config.set(modifier, predicate);
        }

        return config;
    }

    private toParamMap(paramsList: DiscountParam[]): Map<string, string> {
        const map = new Map<string, string>();
        for (const param of paramsList) {
            map.set(param.paramName, param.paramValue);
        }
        return map;
    }
}
