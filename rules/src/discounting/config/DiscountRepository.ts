import { Discount } from "./reflection/Discount";
import { DiscountParam } from "./reflection/DiscountParam";

export interface DiscountRepository {
    findAllDiscounts(): Discount[];
    findParamsByDiscountId(id: string): DiscountParam[];
    insert(discount: Discount): string;
    insertParam(discountParam: DiscountParam): void;
}
