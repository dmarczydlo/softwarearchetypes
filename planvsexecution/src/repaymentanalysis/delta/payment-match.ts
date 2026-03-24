import { Money } from "@softwarearchetypes/quantity";
import { Payment } from "../payment";
import { MatchResult } from "../tolerance/match-result";

export class PaymentMatch {
    readonly planned: Payment;
    readonly actual: Payment[];
    readonly matchResult: MatchResult;

    constructor(planned: Payment, actual: Payment[], matchResult: MatchResult) {
        this.planned = planned;
        this.actual = actual;
        this.matchResult = matchResult;
    }

    totalActualAmount(): Money {
        return this.actual
            .map(p => p.amount)
            .reduce((sum, a) => sum.add(a), Money.zeroPln());
    }
}
