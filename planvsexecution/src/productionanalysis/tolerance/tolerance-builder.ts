import { ExactMatch } from "./exact-match";
import { QuantityTolerance } from "./quantity-tolerance";
import { CombinedTolerance } from "./combined-tolerance";
import { ToleranceStrategy } from "./tolerance-strategy";

/**
 * Builder for creating tolerance strategies.
 * Fluent API for composing different tolerance interpretations.
 */
export class ToleranceBuilder {

    private readonly strategies: ToleranceStrategy[] = [];

    static exact(): ToleranceStrategy {
        return new ExactMatch();
    }

    static quantityTolerance(percentageTolerance: number, absoluteTolerance: number): ToleranceStrategy {
        return new QuantityTolerance(percentageTolerance, absoluteTolerance);
    }

    static tolerance(): ToleranceBuilder {
        return new ToleranceBuilder();
    }

    quantity(percentageTolerance: number, absoluteTolerance: number): ToleranceBuilder {
        this.strategies.push(new QuantityTolerance(percentageTolerance, absoluteTolerance));
        return this;
    }

    build(): ToleranceStrategy {
        if (this.strategies.length === 0) {
            return new ExactMatch();
        }
        if (this.strategies.length === 1) {
            return this.strategies[0];
        }
        return new CombinedTolerance(this.strategies);
    }
}
