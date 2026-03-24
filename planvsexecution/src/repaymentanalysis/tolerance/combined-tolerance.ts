import { Payment } from "../payment";
import { MatchResult } from "./match-result";
import { ToleranceStrategy, andStrategy } from "./tolerance-strategy";

export class CombinedTolerance implements ToleranceStrategy {

    private readonly moneyStrategy: ToleranceStrategy;
    private readonly dateStrategy: ToleranceStrategy;

    constructor(moneyStrategy: ToleranceStrategy, dateStrategy: ToleranceStrategy) {
        this.moneyStrategy = moneyStrategy;
        this.dateStrategy = dateStrategy;
    }

    matches(planned: Payment, actual: Payment[]): MatchResult {
        return andStrategy(this.moneyStrategy, this.dateStrategy).matches(planned, actual);
    }
}
