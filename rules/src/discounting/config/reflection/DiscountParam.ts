export class DiscountParam {
    readonly discountId: string;
    readonly paramName: string;
    readonly paramValue: string;

    constructor(discountId: string, paramName: string, paramValue: string) {
        this.discountId = discountId;
        this.paramName = paramName;
        this.paramValue = paramValue;
    }
}
