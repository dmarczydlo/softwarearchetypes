import { Money, Percentage } from "@softwarearchetypes/quantity";
import { ToleranceStrategy } from "./tolerance-strategy";
import { ExactMatch } from "./exact-match";
import { MoneyTolerance } from "./money-tolerance";
import { PercentageTolerance } from "./percentage-tolerance";
import { DateTolerance } from "./date-tolerance";
import { CombinedTolerance } from "./combined-tolerance";
import { PartialPaymentsStrategy } from "./partial-payments-strategy";

export class ToleranceBuilder {

    private moneyStrategy: ToleranceStrategy | null = null;
    private dateStrategy: ToleranceStrategy | null = null;

    private constructor() {}

    static tolerance(): ToleranceBuilder {
        return new ToleranceBuilder();
    }

    static exact(): ToleranceStrategy {
        return new ExactMatch();
    }

    money(tolerance: Money): ToleranceBuilder {
        this.moneyStrategy = ToleranceBuilder.moneyTolerance(tolerance);
        return this;
    }

    percentage(tolerance: Percentage): ToleranceBuilder {
        this.moneyStrategy = new PercentageTolerance(tolerance);
        return this;
    }

    days(toleranceDays: number): ToleranceBuilder {
        this.dateStrategy = new DateTolerance(toleranceDays);
        return this;
    }

    build(): ToleranceStrategy {
        if (this.moneyStrategy === null && this.dateStrategy === null) {
            return ToleranceBuilder.exact();
        }

        if (this.moneyStrategy !== null && this.dateStrategy !== null) {
            return new CombinedTolerance(this.moneyStrategy, this.dateStrategy);
        }

        if (this.moneyStrategy !== null) {
            return this.moneyStrategy;
        }

        return this.dateStrategy!;
    }

    static fiveGroszy(): ToleranceStrategy {
        return ToleranceBuilder.moneyTolerance(Money.pln(0.05));
    }

    static moneyTolerance(pln: Money): ToleranceStrategy {
        return new MoneyTolerance(pln);
    }

    static halfPercent(): ToleranceStrategy {
        return new PercentageTolerance(Percentage.of(0.5));
    }

    static threeDays(): ToleranceStrategy {
        return new DateTolerance(3);
    }

    static lenient(): ToleranceStrategy {
        return ToleranceBuilder.tolerance()
            .money(Money.pln(0.05))
            .days(3)
            .build();
    }

    static partialPayments(tolerance: Money, deadline: Date): ToleranceStrategy {
        return new PartialPaymentsStrategy(tolerance, deadline);
    }
}
