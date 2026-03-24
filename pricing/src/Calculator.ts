import { Money } from "@softwarearchetypes/quantity";
import { CalculatorId } from "./CalculatorId.js";
import { CalculatorType, formatDescription, requiredCalculationFields } from "./CalculatorType.js";
import { Interpretation } from "./Interpretation.js";
import { Parameters } from "./Parameters.js";
import { StepBoundary } from "./StepBoundary.js";
import { Ranges } from "./Ranges.js";
import { CalculatorRange } from "./CalculatorRange.js";
import { CalculatorRepository } from "./PricingConfiguration.js";

export interface Calculator {
    calculate(parameters: Parameters): Money;
    describe(): string;
    formula(): string;
    interpretation(): Interpretation;
    simulate(points: Parameters[]): Map<Parameters, Money>;
    getType(): CalculatorType;
    getId(): CalculatorId;
    name(): string;
}

function defaultSimulate(calc: Calculator, points: Parameters[]): Map<Parameters, Money> {
    const results = new Map<Parameters, Money>();
    for (const params of points) {
        results.set(params, calc.calculate(params));
    }
    return results;
}

// ============================================================================
// SimpleFixedCalculator
// ============================================================================

export class SimpleFixedCalculator implements Calculator {
    readonly id: CalculatorId;
    private readonly _name: string;
    private readonly amount: Money;
    private readonly _interpretation: Interpretation;

    constructor(name: string, amount: Money, interpretation?: Interpretation);
    constructor(id: CalculatorId, name: string, amount: Money, interpretation: Interpretation);
    constructor(
        idOrName: CalculatorId | string,
        nameOrAmount: string | Money,
        amountOrInterpretation?: Money | Interpretation,
        interpretation4?: Interpretation
    ) {
        if (idOrName instanceof CalculatorId) {
            this.id = idOrName;
            this._name = nameOrAmount as string;
            this.amount = amountOrInterpretation as Money;
            this._interpretation = interpretation4 ?? Interpretation.TOTAL;
        } else {
            this.id = CalculatorId.generate();
            this._name = idOrName;
            this.amount = nameOrAmount as Money;
            this._interpretation = (amountOrInterpretation as Interpretation | undefined) ?? Interpretation.TOTAL;
        }
    }

    calculate(_parameters: Parameters): Money {
        return this.amount;
    }

    describe(): string {
        return formatDescription(this.getType(), this.amount);
    }

    formula(): string {
        return `f(x) = ${this.amount}`;
    }

    interpretation(): Interpretation {
        return this._interpretation;
    }

    simulate(points: Parameters[]): Map<Parameters, Money> {
        return defaultSimulate(this, points);
    }

    getType(): CalculatorType {
        return CalculatorType.SIMPLE_FIXED;
    }

    getId(): CalculatorId {
        return this.id;
    }

    name(): string {
        return this._name;
    }
}

// ============================================================================
// SimpleInterestCalculator
// ============================================================================

type ChronoUnit = "DAYS" | "WEEKS" | "MONTHS" | "YEARS";

export class SimpleInterestCalculator implements Calculator {
    private static readonly SCALE = 10;
    readonly id: CalculatorId;
    private readonly _name: string;
    private readonly annualRate: number;

    constructor(name: string, annualRate: number);
    constructor(id: CalculatorId, name: string, annualRate: number);
    constructor(idOrName: CalculatorId | string, nameOrRate: string | number, rate?: number) {
        if (idOrName instanceof CalculatorId) {
            this.id = idOrName;
            this._name = nameOrRate as string;
            this.annualRate = rate!;
        } else {
            this.id = CalculatorId.generate();
            this._name = idOrName;
            this.annualRate = nameOrRate as number;
        }
    }

    calculate(parameters: Parameters): Money {
        if (!parameters.containsAll(requiredCalculationFields(this.getType()))) {
            throw new Error(`SimpleInterestCalculator requires ${[...requiredCalculationFields(this.getType())]} parameters`);
        }

        const base = parameters.get("base") as Money;
        const unit = parameters.get("unit") as ChronoUnit;

        const rate = this.annualRate / 100;
        const unitRate = rate / this.unitsPerYear(unit);

        return base.multiply(unitRate);
    }

    describe(): string {
        return formatDescription(this.getType(), this.annualRate);
    }

    formula(): string {
        return `f(base, unit) = base * (rate/100) * (1/unitsPerYear(unit))\nwhere rate = ${this.annualRate}%`;
    }

    interpretation(): Interpretation {
        return Interpretation.TOTAL;
    }

    simulate(points: Parameters[]): Map<Parameters, Money> {
        return defaultSimulate(this, points);
    }

    getType(): CalculatorType {
        return CalculatorType.SIMPLE_INTEREST;
    }

    getId(): CalculatorId {
        return this.id;
    }

    name(): string {
        return this._name;
    }

    private unitsPerYear(unit: ChronoUnit): number {
        switch (unit) {
            case "DAYS": return 365;
            case "WEEKS": return 52;
            case "MONTHS": return 12;
            case "YEARS": return 1;
            default: throw new Error(`Unsupported unit for annual calculation: ${unit}`);
        }
    }
}

// ============================================================================
// StepFunctionCalculator
// ============================================================================

export class StepFunctionCalculator implements Calculator {
    readonly id: CalculatorId;
    private readonly _name: string;
    private readonly basePrice: Money;
    private readonly stepSize: number;
    private readonly stepIncrement: number;
    private readonly _interpretation: Interpretation;
    private readonly stepBoundary: StepBoundary;

    constructor(name: string, basePrice: Money, stepSize: number, stepIncrement: number, interpretation?: Interpretation, stepBoundary?: StepBoundary);
    constructor(id: CalculatorId, name: string, basePrice: Money, stepSize: number, stepIncrement: number, interpretation?: Interpretation, stepBoundary?: StepBoundary);
    constructor(
        idOrName: CalculatorId | string,
        nameOrBasePrice: string | Money,
        basePriceOrStepSize: Money | number,
        stepSizeOrStepIncrement: number,
        stepIncrementOrInterp?: number | Interpretation,
        interpOrBoundary?: Interpretation | StepBoundary,
        boundary7?: StepBoundary
    ) {
        if (idOrName instanceof CalculatorId) {
            this.id = idOrName;
            this._name = nameOrBasePrice as string;
            this.basePrice = basePriceOrStepSize as Money;
            this.stepSize = stepSizeOrStepIncrement;
            this.stepIncrement = stepIncrementOrInterp as number;
            this._interpretation = (interpOrBoundary as Interpretation | undefined) ?? Interpretation.TOTAL;
            this.stepBoundary = boundary7 ?? StepBoundary.EXCLUSIVE;
        } else {
            this.id = CalculatorId.generate();
            this._name = idOrName;
            this.basePrice = nameOrBasePrice as Money;
            this.stepSize = basePriceOrStepSize as number;
            this.stepIncrement = stepSizeOrStepIncrement;
            this._interpretation = (stepIncrementOrInterp as Interpretation | undefined) ?? Interpretation.TOTAL;
            this.stepBoundary = (interpOrBoundary as StepBoundary | undefined) ?? StepBoundary.EXCLUSIVE;
        }
    }

    calculate(parameters: Parameters): Money {
        if (!parameters.containsAll(requiredCalculationFields(this.getType()))) {
            throw new Error(`StepFunctionCalculator requires ${[...requiredCalculationFields(this.getType())]} parameters`);
        }

        const quantity = parameters.getNumber("quantity");

        let steps: number;
        if (this.stepBoundary === StepBoundary.INCLUSIVE && quantity > 0) {
            steps = Math.floor((quantity - 1) / this.stepSize);
        } else {
            steps = Math.floor(quantity / this.stepSize);
        }

        const totalIncrementValue = this.stepIncrement * steps;
        const incrementTotal = Money.of(totalIncrementValue, this.basePrice.currency());

        return this.basePrice.add(incrementTotal);
    }

    describe(): string {
        return `Step function calculator - base price ${this.basePrice} + increments every ${this.stepSize} units`;
    }

    formula(): string {
        return `f(quantity) = basePrice + floor(quantity/${this.stepSize}) * ${this.stepIncrement}\nwhere basePrice = ${this.basePrice}`;
    }

    interpretation(): Interpretation {
        return this._interpretation;
    }

    simulate(points: Parameters[]): Map<Parameters, Money> {
        return defaultSimulate(this, points);
    }

    getType(): CalculatorType {
        return CalculatorType.STEP_FUNCTION;
    }

    getId(): CalculatorId {
        return this.id;
    }

    name(): string {
        return this._name;
    }
}

// ============================================================================
// DiscretePointsCalculator
// ============================================================================

export class DiscretePointsCalculator implements Calculator {
    readonly id: CalculatorId;
    private readonly _name: string;
    private readonly points: Map<number, Money>;
    private readonly _interpretation: Interpretation;

    constructor(name: string, points: Map<number, Money>, interpretation?: Interpretation);
    constructor(id: CalculatorId, name: string, points: Map<number, Money>, interpretation?: Interpretation);
    constructor(
        idOrName: CalculatorId | string,
        nameOrPoints: string | Map<number, Money>,
        pointsOrInterp?: Map<number, Money> | Interpretation,
        interp4?: Interpretation
    ) {
        if (idOrName instanceof CalculatorId) {
            this.id = idOrName;
            this._name = nameOrPoints as string;
            this.points = new Map(pointsOrInterp as Map<number, Money>);
            this._interpretation = interp4 ?? Interpretation.TOTAL;
        } else {
            this.id = CalculatorId.generate();
            this._name = idOrName;
            this.points = new Map(nameOrPoints as Map<number, Money>);
            this._interpretation = (pointsOrInterp as Interpretation | undefined) ?? Interpretation.TOTAL;
        }
    }

    calculate(parameters: Parameters): Money {
        if (!parameters.containsAll(requiredCalculationFields(this.getType()))) {
            throw new Error(`DiscretePointsCalculator requires ${[...requiredCalculationFields(this.getType())]} parameters`);
        }

        const quantity = parameters.getNumber("quantity");

        const price = this.points.get(quantity);
        if (price === undefined) {
            throw new Error(
                `Quantity ${quantity} is not defined in the price points. Available quantities: ${[...this.points.keys()]}`
            );
        }

        return price;
    }

    describe(): string {
        return `Discrete points calculator with ${this.points.size} price points: ${[...this.points.entries()].map(([k, v]) => `${k}=${v}`).join(", ")}`;
    }

    formula(): string {
        const lines = [`f(quantity) = lookup(quantity)`, `Defined points:`];
        const sorted = [...this.points.entries()].sort((a, b) => a[0] - b[0]);
        for (const [qty, price] of sorted) {
            lines.push(`  quantity = ${qty} -> ${price}`);
        }
        return lines.join("\n");
    }

    interpretation(): Interpretation {
        return this._interpretation;
    }

    simulate(points: Parameters[]): Map<Parameters, Money> {
        return defaultSimulate(this, points);
    }

    getType(): CalculatorType {
        return CalculatorType.DISCRETE_POINTS;
    }

    getId(): CalculatorId {
        return this.id;
    }

    name(): string {
        return this._name;
    }
}

// ============================================================================
// DailyIncrementCalculator
// ============================================================================

export class DailyIncrementCalculator implements Calculator {
    readonly id: CalculatorId;
    private readonly _name: string;
    private readonly startDate: Date;
    private readonly startPrice: Money;
    private readonly dailyIncrement: Money;
    private readonly _interpretation: Interpretation;

    constructor(name: string, startDate: Date, startPrice: Money, dailyIncrement: Money, interpretation?: Interpretation);
    constructor(id: CalculatorId, name: string, startDate: Date, startPrice: Money, dailyIncrement: Money, interpretation?: Interpretation);
    constructor(
        idOrName: CalculatorId | string,
        nameOrStartDate: string | Date,
        startDateOrStartPrice: Date | Money,
        startPriceOrDailyIncrement: Money,
        dailyIncrementOrInterp?: Money | Interpretation,
        interp6?: Interpretation
    ) {
        if (idOrName instanceof CalculatorId) {
            this.id = idOrName;
            this._name = nameOrStartDate as string;
            this.startDate = startDateOrStartPrice as Date;
            this.startPrice = startPriceOrDailyIncrement;
            this.dailyIncrement = dailyIncrementOrInterp as Money;
            this._interpretation = interp6 ?? Interpretation.TOTAL;
        } else {
            this.id = CalculatorId.generate();
            this._name = idOrName;
            this.startDate = nameOrStartDate as Date;
            this.startPrice = startDateOrStartPrice as Money;
            this.dailyIncrement = startPriceOrDailyIncrement;
            this._interpretation = (dailyIncrementOrInterp as Interpretation | undefined) ?? Interpretation.TOTAL;
        }
    }

    calculate(parameters: Parameters): Money {
        if (!parameters.containsAll(requiredCalculationFields(this.getType()))) {
            throw new Error(`DailyIncrementCalculator requires ${[...requiredCalculationFields(this.getType())]} parameters`);
        }

        const date = parameters.get("date") as Date;
        const daysFromStart = Math.round((date.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const totalIncrement = this.dailyIncrement.multiply(daysFromStart);

        return this.startPrice.add(totalIncrement);
    }

    describe(): string {
        return `Daily increment calculator - starts at ${this.startPrice} on ${formatDateOnly(this.startDate)}, grows by ${this.dailyIncrement} per day`;
    }

    formula(): string {
        return `f(date) = startPrice + daysFromStart * dailyIncrement\nwhere:\n  startDate = ${formatDateOnly(this.startDate)}\n  startPrice = ${this.startPrice}\n  dailyIncrement = ${this.dailyIncrement}`;
    }

    interpretation(): Interpretation {
        return this._interpretation;
    }

    simulate(points: Parameters[]): Map<Parameters, Money> {
        return defaultSimulate(this, points);
    }

    getType(): CalculatorType {
        return CalculatorType.DAILY_INCREMENT;
    }

    getId(): CalculatorId {
        return this.id;
    }

    name(): string {
        return this._name;
    }
}

// ============================================================================
// ContinuousLinearTimeCalculator
// ============================================================================

export class ContinuousLinearTimeCalculator implements Calculator {
    readonly id: CalculatorId;
    private readonly _name: string;
    private readonly startTime: Date;
    private readonly startPrice: Money;
    private readonly endTime: Date;
    private readonly endPrice: Money;
    private readonly _interpretation: Interpretation;

    constructor(name: string, startTime: Date, startPrice: Money, endTime: Date, endPrice: Money, interpretation?: Interpretation);
    constructor(id: CalculatorId, name: string, startTime: Date, startPrice: Money, endTime: Date, endPrice: Money, interpretation?: Interpretation);
    constructor(
        idOrName: CalculatorId | string,
        nameOrStartTime: string | Date,
        startTimeOrStartPrice: Date | Money,
        startPriceOrEndTime: Money | Date,
        endTimeOrEndPrice: Date | Money,
        endPriceOrInterp?: Money | Interpretation,
        interp7?: Interpretation
    ) {
        if (idOrName instanceof CalculatorId) {
            this.id = idOrName;
            this._name = nameOrStartTime as string;
            this.startTime = startTimeOrStartPrice as Date;
            this.startPrice = startPriceOrEndTime as Money;
            this.endTime = endTimeOrEndPrice as Date;
            this.endPrice = endPriceOrInterp as Money;
            this._interpretation = interp7 ?? Interpretation.TOTAL;
        } else {
            this.id = CalculatorId.generate();
            this._name = idOrName;
            this.startTime = nameOrStartTime as Date;
            this.startPrice = startTimeOrStartPrice as Money;
            this.endTime = startPriceOrEndTime as Date;
            this.endPrice = endTimeOrEndPrice as Money;
            this._interpretation = (endPriceOrInterp as Interpretation | undefined) ?? Interpretation.TOTAL;
        }
    }

    calculate(parameters: Parameters): Money {
        if (!parameters.containsAll(requiredCalculationFields(this.getType()))) {
            throw new Error(`ContinuousLinearTimeCalculator requires ${[...requiredCalculationFields(this.getType())]} parameters`);
        }

        const queryTime = parameters.getTime("time");

        if (queryTime.getTime() < this.startTime.getTime()) {
            throw new Error(`Query time ${queryTime.toISOString()} is before start time ${this.startTime.toISOString()}`);
        }
        if (queryTime.getTime() > this.endTime.getTime()) {
            throw new Error(`Query time ${queryTime.toISOString()} is after end time ${this.endTime.toISOString()}`);
        }

        const totalSeconds = (this.endTime.getTime() - this.startTime.getTime()) / 1000;
        const elapsedSeconds = (queryTime.getTime() - this.startTime.getTime()) / 1000;

        const progress = elapsedSeconds / totalSeconds;

        const priceRange = this.endPrice.subtract(this.startPrice);
        const interpolatedIncrease = priceRange.multiply(progress);

        return this.startPrice.add(interpolatedIncrease);
    }

    describe(): string {
        return `Continuous linear time calculator - from ${this.startPrice} to ${this.endPrice} between ${formatDateTime(this.startTime)} and ${formatDateTime(this.endTime)}`;
    }

    formula(): string {
        return `f(t) = startPrice + progress * (endPrice - startPrice)\nwhere progress = (t - startTime) / (endTime - startTime)\ndomain: t in [${formatDateTime(this.startTime)}, ${formatDateTime(this.endTime)}]`;
    }

    interpretation(): Interpretation {
        return this._interpretation;
    }

    simulate(points: Parameters[]): Map<Parameters, Money> {
        return defaultSimulate(this, points);
    }

    getType(): CalculatorType {
        return CalculatorType.CONTINUOUS_LINEAR_TIME;
    }

    getId(): CalculatorId {
        return this.id;
    }

    name(): string {
        return this._name;
    }
}

// ============================================================================
// CompositeFunctionCalculator
// ============================================================================

export class CompositeFunctionCalculator implements Calculator {
    readonly id: CalculatorId;
    private readonly _name: string;
    private readonly ranges: Ranges;
    private readonly repository: CalculatorRepository;

    constructor(name: string, ranges: Ranges, repository: CalculatorRepository);
    constructor(id: CalculatorId, name: string, ranges: Ranges, repository: CalculatorRepository);
    constructor(
        idOrName: CalculatorId | string,
        nameOrRanges: string | Ranges,
        rangesOrRepo: Ranges | CalculatorRepository,
        repo4?: CalculatorRepository
    ) {
        if (idOrName instanceof CalculatorId) {
            this.id = idOrName;
            this._name = nameOrRanges as string;
            this.ranges = rangesOrRepo as Ranges;
            this.repository = repo4!;
        } else {
            this.id = CalculatorId.generate();
            this._name = idOrName;
            this.ranges = nameOrRanges as Ranges;
            this.repository = rangesOrRepo as CalculatorRepository;
        }
        CompositeFunctionCalculator.validateUniformInterpretation(this.ranges, this.repository);
    }

    private static validateUniformInterpretation(ranges: Ranges, repository: CalculatorRepository): void {
        const calculatorIds = new Set(ranges.toList().map(r => r.calculatorId()));

        if (calculatorIds.size === 0) {
            throw new Error("Composite calculator must have at least one range");
        }

        const calculators = repository.findByIds([...calculatorIds]);

        if (calculators.length !== calculatorIds.size) {
            const foundIds = calculators.map(c => c.getId());
            const missingIds = [...calculatorIds].filter(id => !foundIds.some(fid => fid.equals(id)));
            throw new Error(`Calculators not found in repository: ${missingIds}`);
        }

        const interpretations = new Set(calculators.map(c => c.interpretation()));

        if (interpretations.size > 1) {
            throw new Error(
                `All component calculators in composite must have the same interpretation. Found: ${calculators.map(c => c.name() + ":" + c.interpretation()).join(", ")}`
            );
        }
    }

    interpretation(): Interpretation {
        const firstRange = this.ranges.toList()[0];
        if (firstRange) {
            const calc = this.repository.findById(firstRange.calculatorId());
            if (calc) return calc.interpretation();
        }
        return Interpretation.TOTAL;
    }

    calculate(parameters: Parameters): Money {
        const matchingRange = this.ranges.findMatching(parameters);
        if (!matchingRange) {
            throw new Error(`No matching range found in ${this.ranges}`);
        }

        const calculator = this.repository.findById(matchingRange.calculatorId());
        if (!calculator) {
            throw new Error(`Calculator '${matchingRange.calculatorId()}' not found in repository`);
        }

        return calculator.calculate(parameters);
    }

    describe(): string {
        return `Composite function calculator: ${this.ranges}`;
    }

    formula(): string {
        const lines = ["f(x) = piecewise function:"];
        for (const range of this.ranges.toList()) {
            const calc = this.repository.findById(range.calculatorId());
            if (!calc) {
                throw new Error(`Calculator '${range.calculatorId()}' not found`);
            }
            lines.push(`  ${range.describe()} -> ${calc.name()}: ${calc.formula().replace(/\n/g, " ")}`);
        }
        return lines.join("\n");
    }

    simulate(points: Parameters[]): Map<Parameters, Money> {
        return defaultSimulate(this, points);
    }

    getType(): CalculatorType {
        return CalculatorType.COMPOSITE;
    }

    getId(): CalculatorId {
        return this.id;
    }

    name(): string {
        return this._name;
    }
}

// ============================================================================
// Price Adapters
// ============================================================================

export class UnitToTotalAdapter implements Calculator {
    readonly id: CalculatorId;
    private readonly _name: string;
    private readonly sourceCalculator: Calculator;

    private constructor(id: CalculatorId, name: string, sourceCalculator: Calculator) {
        this.id = id;
        this._name = name;
        this.sourceCalculator = sourceCalculator;
    }

    static wrap(name: string, sourceCalculator: Calculator): UnitToTotalAdapter {
        if (sourceCalculator.interpretation() !== Interpretation.UNIT) {
            throw new Error(`UnitToTotalAdapter requires UNIT calculator, got: ${sourceCalculator.interpretation()}`);
        }
        return new UnitToTotalAdapter(CalculatorId.generate(), name, sourceCalculator);
    }

    getType(): CalculatorType { return CalculatorType.UNIT_TO_TOTAL_ADAPTER; }
    calculate(params: Parameters): Money {
        const quantity = params.getNumber("quantity");
        const unitPrice = this.sourceCalculator.calculate(params);
        return unitPrice.multiply(quantity);
    }
    formula(): string { return `quantity * (${this.sourceCalculator.formula()})`; }
    describe(): string { return `Unit to Total: ${this.sourceCalculator.describe()}`; }
    interpretation(): Interpretation { return Interpretation.TOTAL; }
    simulate(points: Parameters[]): Map<Parameters, Money> { return defaultSimulate(this, points); }
    getId(): CalculatorId { return this.id; }
    name(): string { return this._name; }
}

export class UnitToMarginalAdapter implements Calculator {
    readonly id: CalculatorId;
    private readonly _name: string;
    private readonly sourceCalculator: Calculator;

    private constructor(id: CalculatorId, name: string, sourceCalculator: Calculator) {
        this.id = id;
        this._name = name;
        this.sourceCalculator = sourceCalculator;
    }

    static wrap(name: string, sourceCalculator: Calculator): UnitToMarginalAdapter {
        if (sourceCalculator.interpretation() !== Interpretation.UNIT) {
            throw new Error(`UnitToMarginalAdapter requires UNIT calculator, got: ${sourceCalculator.interpretation()}`);
        }
        return new UnitToMarginalAdapter(CalculatorId.generate(), name, sourceCalculator);
    }

    getType(): CalculatorType { return CalculatorType.UNIT_TO_MARGINAL_ADAPTER; }
    calculate(params: Parameters): Money {
        const quantity = params.getNumber("quantity");
        if (quantity < 1) throw new Error("Marginal price requires quantity >= 1");

        const unitPriceN = this.sourceCalculator.calculate(params);
        const totalN = unitPriceN.multiply(quantity);

        if (quantity === 1) return totalN;

        const quantityMinusOne = quantity - 1;
        const paramsN1 = Parameters.of("quantity", quantityMinusOne);
        const unitPriceN1 = this.sourceCalculator.calculate(paramsN1);
        const totalN1 = unitPriceN1.multiply(quantityMinusOne);

        return totalN.subtract(totalN1);
    }
    formula(): string { return `marginal(n) = (unit(n) * n) - (unit(n-1) * (n-1)) where unit = ${this.sourceCalculator.formula()}`; }
    describe(): string { return `Unit to Marginal (derivative): ${this.sourceCalculator.describe()}`; }
    interpretation(): Interpretation { return Interpretation.MARGINAL; }
    simulate(points: Parameters[]): Map<Parameters, Money> { return defaultSimulate(this, points); }
    getId(): CalculatorId { return this.id; }
    name(): string { return this._name; }
}

export class TotalToUnitAdapter implements Calculator {
    readonly id: CalculatorId;
    private readonly _name: string;
    private readonly sourceCalculator: Calculator;

    private constructor(id: CalculatorId, name: string, sourceCalculator: Calculator) {
        this.id = id;
        this._name = name;
        this.sourceCalculator = sourceCalculator;
    }

    static wrap(name: string, sourceCalculator: Calculator): TotalToUnitAdapter {
        if (sourceCalculator.interpretation() !== Interpretation.TOTAL) {
            throw new Error(`TotalToUnitAdapter requires TOTAL calculator, got: ${sourceCalculator.interpretation()}`);
        }
        return new TotalToUnitAdapter(CalculatorId.generate(), name, sourceCalculator);
    }

    getType(): CalculatorType { return CalculatorType.TOTAL_TO_UNIT_ADAPTER; }
    calculate(params: Parameters): Money {
        const quantity = params.getNumber("quantity");
        const total = this.sourceCalculator.calculate(params);
        return total.divide(quantity);
    }
    formula(): string { return `(${this.sourceCalculator.formula()}) / quantity`; }
    describe(): string { return `Total to Unit (average): ${this.sourceCalculator.describe()}`; }
    interpretation(): Interpretation { return Interpretation.UNIT; }
    simulate(points: Parameters[]): Map<Parameters, Money> { return defaultSimulate(this, points); }
    getId(): CalculatorId { return this.id; }
    name(): string { return this._name; }
}

export class TotalToMarginalAdapter implements Calculator {
    readonly id: CalculatorId;
    private readonly _name: string;
    private readonly sourceCalculator: Calculator;

    private constructor(id: CalculatorId, name: string, sourceCalculator: Calculator) {
        this.id = id;
        this._name = name;
        this.sourceCalculator = sourceCalculator;
    }

    static wrap(name: string, sourceCalculator: Calculator): TotalToMarginalAdapter {
        if (sourceCalculator.interpretation() !== Interpretation.TOTAL) {
            throw new Error(`TotalToMarginalAdapter requires TOTAL calculator, got: ${sourceCalculator.interpretation()}`);
        }
        return new TotalToMarginalAdapter(CalculatorId.generate(), name, sourceCalculator);
    }

    getType(): CalculatorType { return CalculatorType.TOTAL_TO_MARGINAL_ADAPTER; }
    calculate(params: Parameters): Money {
        const quantity = params.getNumber("quantity");
        if (quantity < 1) throw new Error("Marginal price requires quantity >= 1");

        const totalN = this.sourceCalculator.calculate(params);
        if (quantity === 1) return totalN;

        const quantityMinusOne = quantity - 1;
        const paramsN1 = Parameters.of("quantity", quantityMinusOne);
        const totalN1 = this.sourceCalculator.calculate(paramsN1);

        return totalN.subtract(totalN1);
    }
    formula(): string { return `marginal(n) = total(n) - total(n-1) where total = ${this.sourceCalculator.formula()}`; }
    describe(): string { return `Total to Marginal (derivative): ${this.sourceCalculator.describe()}`; }
    interpretation(): Interpretation { return Interpretation.MARGINAL; }
    simulate(points: Parameters[]): Map<Parameters, Money> { return defaultSimulate(this, points); }
    getId(): CalculatorId { return this.id; }
    name(): string { return this._name; }
}

export class MarginalToTotalAdapter implements Calculator {
    readonly id: CalculatorId;
    private readonly _name: string;
    private readonly sourceCalculator: Calculator;

    private constructor(id: CalculatorId, name: string, sourceCalculator: Calculator) {
        this.id = id;
        this._name = name;
        this.sourceCalculator = sourceCalculator;
    }

    static wrap(name: string, sourceCalculator: Calculator): MarginalToTotalAdapter {
        if (sourceCalculator.interpretation() !== Interpretation.MARGINAL) {
            throw new Error(`MarginalToTotalAdapter requires MARGINAL calculator, got: ${sourceCalculator.interpretation()}`);
        }
        return new MarginalToTotalAdapter(CalculatorId.generate(), name, sourceCalculator);
    }

    getType(): CalculatorType { return CalculatorType.MARGINAL_TO_TOTAL_ADAPTER; }
    calculate(params: Parameters): Money {
        const quantity = params.getNumber("quantity");

        let total = this.sourceCalculator.calculate(Parameters.of("quantity", 1));

        for (let i = 2; i <= quantity; i++) {
            const marginal = this.sourceCalculator.calculate(Parameters.of("quantity", i));
            total = total.add(marginal);
        }

        return total;
    }
    formula(): string { return `sum[i=1->q] (${this.sourceCalculator.formula()})`; }
    describe(): string { return `Marginal to Total (sum): ${this.sourceCalculator.describe()}`; }
    interpretation(): Interpretation { return Interpretation.TOTAL; }
    simulate(points: Parameters[]): Map<Parameters, Money> { return defaultSimulate(this, points); }
    getId(): CalculatorId { return this.id; }
    name(): string { return this._name; }
}

export class MarginalToUnitAdapter implements Calculator {
    readonly id: CalculatorId;
    private readonly _name: string;
    private readonly sourceCalculator: Calculator;

    private constructor(id: CalculatorId, name: string, sourceCalculator: Calculator) {
        this.id = id;
        this._name = name;
        this.sourceCalculator = sourceCalculator;
    }

    static wrap(name: string, sourceCalculator: Calculator): MarginalToUnitAdapter {
        if (sourceCalculator.interpretation() !== Interpretation.MARGINAL) {
            throw new Error(`MarginalToUnitAdapter requires MARGINAL calculator, got: ${sourceCalculator.interpretation()}`);
        }
        return new MarginalToUnitAdapter(CalculatorId.generate(), name, sourceCalculator);
    }

    getType(): CalculatorType { return CalculatorType.MARGINAL_TO_UNIT_ADAPTER; }
    calculate(params: Parameters): Money {
        const quantity = params.getNumber("quantity");

        let total = this.sourceCalculator.calculate(Parameters.of("quantity", 1));
        for (let i = 2; i <= quantity; i++) {
            const marginal = this.sourceCalculator.calculate(Parameters.of("quantity", i));
            total = total.add(marginal);
        }

        return total.divide(quantity);
    }
    formula(): string { return `(sum[i=1->q] (${this.sourceCalculator.formula()})) / quantity`; }
    describe(): string { return `Marginal to Unit (average): ${this.sourceCalculator.describe()}`; }
    interpretation(): Interpretation { return Interpretation.UNIT; }
    simulate(points: Parameters[]): Map<Parameters, Money> { return defaultSimulate(this, points); }
    getId(): CalculatorId { return this.id; }
    name(): string { return this._name; }
}

// ============================================================================
// PercentageCalculator
// ============================================================================

export class PercentageCalculator implements Calculator {
    readonly id: CalculatorId;
    private readonly _name: string;
    private readonly percentageRate: number;

    constructor(name: string, percentageRate: number);
    constructor(id: CalculatorId, name: string, percentageRate: number);
    constructor(idOrName: CalculatorId | string, nameOrRate: string | number, rate3?: number) {
        if (idOrName instanceof CalculatorId) {
            this.id = idOrName;
            this._name = nameOrRate as string;
            this.percentageRate = rate3!;
        } else {
            this.id = CalculatorId.generate();
            this._name = idOrName;
            this.percentageRate = nameOrRate as number;
        }
    }

    getType(): CalculatorType { return CalculatorType.PERCENTAGE; }
    calculate(params: Parameters): Money {
        const baseAmount = params.getMoney("baseAmount");
        const rate = this.percentageRate / 100;
        const result = baseAmount.multiply(rate);
        return Money.of(Math.round(result.value() * 100) / 100, result.currency());
    }
    formula(): string { return `baseAmount * ${this.percentageRate}%`; }
    describe(): string { return `Percentage: ${this.percentageRate}% of base amount`; }
    interpretation(): Interpretation { return Interpretation.TOTAL; }
    simulate(points: Parameters[]): Map<Parameters, Money> { return defaultSimulate(this, points); }
    getId(): CalculatorId { return this.id; }
    name(): string { return this._name; }
}

// ============================================================================
// Helper functions
// ============================================================================

function formatDateOnly(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDateTime(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}
