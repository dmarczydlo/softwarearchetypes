import { Money } from '@softwarearchetypes/quantity';

export class PriceBreakdown {
    readonly componentName: string;
    readonly amount: Money;
    readonly children: PriceBreakdown[];

    constructor(componentName: string, amount: Money, children: PriceBreakdown[] = []) {
        this.componentName = componentName;
        this.amount = amount;
        this.children = [...children];
    }
}
