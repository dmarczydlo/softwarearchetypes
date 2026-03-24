import { Money } from "@softwarearchetypes/quantity";

export class Modification {
    readonly amount: Money;
    readonly description: string;

    constructor(amount: Money, description: string) {
        this.amount = amount;
        this.description = description;
    }
}
