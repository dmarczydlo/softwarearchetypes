export enum Interpretation {
    TOTAL = "TOTAL",
    UNIT = "UNIT",
    MARGINAL = "MARGINAL",
}

export function describeInterpretation(interpretation: Interpretation): string {
    switch (interpretation) {
        case Interpretation.TOTAL:
            return "Total price for entire quantity/period";
        case Interpretation.UNIT:
            return "Average price per single unit";
        case Interpretation.MARGINAL:
            return "Price of n-th specific unit";
    }
}
