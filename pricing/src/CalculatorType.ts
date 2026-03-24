export enum CalculatorType {
    SIMPLE_FIXED = "simple-fixed",
    SIMPLE_INTEREST = "simple-interest",
    STEP_FUNCTION = "step-function",
    DISCRETE_POINTS = "discrete-points",
    DAILY_INCREMENT = "daily-increment",
    CONTINUOUS_LINEAR_TIME = "continuous-linear-time",
    COMPOSITE = "composite",
    PERCENTAGE = "percentage",
    UNIT_TO_TOTAL_ADAPTER = "unit-to-total-adapter",
    UNIT_TO_MARGINAL_ADAPTER = "unit-to-marginal-adapter",
    TOTAL_TO_UNIT_ADAPTER = "total-to-unit-adapter",
    TOTAL_TO_MARGINAL_ADAPTER = "total-to-marginal-adapter",
    MARGINAL_TO_TOTAL_ADAPTER = "marginal-to-total-adapter",
    MARGINAL_TO_UNIT_ADAPTER = "marginal-to-unit-adapter",
}

const typeMetadata: Record<CalculatorType, {
    descriptionTemplate: string;
    requiredCreationFields: Set<string>;
    requiredCalculationFields: Set<string>;
}> = {
    [CalculatorType.SIMPLE_FIXED]: {
        descriptionTemplate: "Fixed amount calculator - returns %s regardless",
        requiredCreationFields: new Set(["amount"]),
        requiredCalculationFields: new Set(),
    },
    [CalculatorType.SIMPLE_INTEREST]: {
        descriptionTemplate: "Annual interest calculator - calculates %s%% annual interest based on base and time unit",
        requiredCreationFields: new Set(["annualRate"]),
        requiredCalculationFields: new Set(["base", "unit"]),
    },
    [CalculatorType.STEP_FUNCTION]: {
        descriptionTemplate: "Step function calculator - base price %s PLN + increments every %s units",
        requiredCreationFields: new Set(["basePrice", "stepSize", "stepIncrement"]),
        requiredCalculationFields: new Set(["quantity"]),
    },
    [CalculatorType.DISCRETE_POINTS]: {
        descriptionTemplate: "Discrete points calculator - price lookup from predefined points",
        requiredCreationFields: new Set(["points"]),
        requiredCalculationFields: new Set(["quantity"]),
    },
    [CalculatorType.DAILY_INCREMENT]: {
        descriptionTemplate: "Daily increment calculator - starts at %s, grows by %s per day (discrete)",
        requiredCreationFields: new Set(["startDate", "startPrice", "dailyIncrement"]),
        requiredCalculationFields: new Set(["date"]),
    },
    [CalculatorType.CONTINUOUS_LINEAR_TIME]: {
        descriptionTemplate: "Continuous linear time calculator - interpolates between %s and %s",
        requiredCreationFields: new Set(["startTime", "startPrice", "endTime", "endPrice"]),
        requiredCalculationFields: new Set(["time"]),
    },
    [CalculatorType.COMPOSITE]: {
        descriptionTemplate: "Composite function calculator - delegates to different calculators based on parameter ranges",
        requiredCreationFields: new Set(["ranges", "rangeSelector"]),
        requiredCalculationFields: new Set(),
    },
    [CalculatorType.PERCENTAGE]: {
        descriptionTemplate: "Percentage calculator - calculates %s%% of base amount",
        requiredCreationFields: new Set(["percentageRate"]),
        requiredCalculationFields: new Set(["baseAmount"]),
    },
    [CalculatorType.UNIT_TO_TOTAL_ADAPTER]: {
        descriptionTemplate: "Converts unit price to total: total = quantity x unitPrice",
        requiredCreationFields: new Set(),
        requiredCalculationFields: new Set(["quantity"]),
    },
    [CalculatorType.UNIT_TO_MARGINAL_ADAPTER]: {
        descriptionTemplate: "Converts unit price to marginal: for constant unit price, marginal = unitPrice",
        requiredCreationFields: new Set(),
        requiredCalculationFields: new Set(["quantity"]),
    },
    [CalculatorType.TOTAL_TO_UNIT_ADAPTER]: {
        descriptionTemplate: "Converts total price to unit price: unitPrice = total / quantity",
        requiredCreationFields: new Set(),
        requiredCalculationFields: new Set(["quantity"]),
    },
    [CalculatorType.TOTAL_TO_MARGINAL_ADAPTER]: {
        descriptionTemplate: "Converts total to marginal: marginal(n) = total(n) - total(n-1)",
        requiredCreationFields: new Set(),
        requiredCalculationFields: new Set(["quantity"]),
    },
    [CalculatorType.MARGINAL_TO_TOTAL_ADAPTER]: {
        descriptionTemplate: "Converts marginal to total: total = sum marginal(i) for i=1..quantity",
        requiredCreationFields: new Set(),
        requiredCalculationFields: new Set(["quantity"]),
    },
    [CalculatorType.MARGINAL_TO_UNIT_ADAPTER]: {
        descriptionTemplate: "Converts marginal to unit price: unitPrice = sum marginal(i) / quantity",
        requiredCreationFields: new Set(),
        requiredCalculationFields: new Set(["quantity"]),
    },
};

export function formatDescription(type: CalculatorType, value: unknown): string {
    return typeMetadata[type].descriptionTemplate.replace("%s", String(value));
}

export function requiredCreationFields(type: CalculatorType): Set<string> {
    return typeMetadata[type].requiredCreationFields;
}

export function requiredCalculationFields(type: CalculatorType): Set<string> {
    return typeMetadata[type].requiredCalculationFields;
}
