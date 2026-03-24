import { Calculator, UnitToTotalAdapter, UnitToMarginalAdapter, TotalToUnitAdapter, TotalToMarginalAdapter, MarginalToTotalAdapter, MarginalToUnitAdapter } from "./Calculator.js";
import { Interpretation } from "./Interpretation.js";

export function adaptCalculator(calc: Calculator, target: Interpretation, adapterNameSuffix?: string): Calculator {
    const suffix = adapterNameSuffix ?? (() => {
        switch (target) {
            case Interpretation.TOTAL: return "-to-total";
            case Interpretation.UNIT: return "-to-unit";
            case Interpretation.MARGINAL: return "-to-marginal";
        }
    })();

    switch (target) {
        case Interpretation.TOTAL:
            switch (calc.interpretation()) {
                case Interpretation.TOTAL: return calc;
                case Interpretation.UNIT: return UnitToTotalAdapter.wrap(calc.name() + suffix, calc);
                case Interpretation.MARGINAL: return MarginalToTotalAdapter.wrap(calc.name() + suffix, calc);
            }
            break;
        case Interpretation.UNIT:
            switch (calc.interpretation()) {
                case Interpretation.UNIT: return calc;
                case Interpretation.TOTAL: return TotalToUnitAdapter.wrap(calc.name() + suffix, calc);
                case Interpretation.MARGINAL: return MarginalToUnitAdapter.wrap(calc.name() + suffix, calc);
            }
            break;
        case Interpretation.MARGINAL:
            switch (calc.interpretation()) {
                case Interpretation.MARGINAL: return calc;
                case Interpretation.UNIT: return UnitToMarginalAdapter.wrap(calc.name() + suffix, calc);
                case Interpretation.TOTAL: return TotalToMarginalAdapter.wrap(calc.name() + suffix, calc);
            }
            break;
    }
    // Should not reach here
    return calc;
}
