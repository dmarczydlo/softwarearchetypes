import { Money } from "@softwarearchetypes/quantity";
import { RichLogicalPredicate } from "../../../predicates/RichLogicalPredicate";
import { ClientContext } from "../ClientContext";

export class ExpensesRule extends RichLogicalPredicate<ClientContext> {
    private readonly _minAmount: Money;

    constructor(minAmount: Money) {
        super();
        this._minAmount = minAmount;
    }

    static of(minAmount: Money): ExpensesRule {
        return new ExpensesRule(minAmount);
    }

    test(clientContext: ClientContext): boolean {
        return clientContext.totalExpenses.isGreaterThanOrEqualTo(this._minAmount);
    }

    getMinAmount(): Money {
        return this._minAmount;
    }
}
