import { Money } from "@softwarearchetypes/quantity";
import {
    Calculator,
    SimpleFixedCalculator,
    SimpleInterestCalculator,
    StepFunctionCalculator,
    DiscretePointsCalculator,
    DailyIncrementCalculator,
    ContinuousLinearTimeCalculator,
    CompositeFunctionCalculator,
    PercentageCalculator,
    UnitToTotalAdapter,
    UnitToMarginalAdapter,
    TotalToUnitAdapter,
    TotalToMarginalAdapter,
    MarginalToTotalAdapter,
    MarginalToUnitAdapter,
} from "./Calculator.js";
import { CalculatorType } from "./CalculatorType.js";
import { CalculatorView } from "./CalculatorView.js";
import { CalculatorRepository, ComponentRepository, InMemoryComponentRepository } from "./PricingConfiguration.js";
import { Component, SimpleComponent, CompositeComponent } from "./Component.js";
import { ComponentBreakdown } from "./ComponentBreakdown.js";
import { CompositeComponentVersion } from "./CompositeComponentVersion.js";
import { Interpretation } from "./Interpretation.js";
import { Parameters } from "./Parameters.js";
import { ParameterValue } from "./ParameterValue.js";
import { Ranges } from "./Ranges.js";
import { SimpleComponentVersion } from "./SimpleComponentVersion.js";
import { StepBoundary } from "./StepBoundary.js";
import { Validity } from "./Validity.js";
import { ApplicabilityConstraint, alwaysTrue } from "./ApplicabilityConstraint.js";
import { CalculatorRange } from "./CalculatorRange.js";

export class PricingFacade {
    private readonly calculatorRepository: CalculatorRepository;
    private readonly componentRepository: ComponentRepository;
    private readonly now: Date;

    constructor(
        calculatorRepository: CalculatorRepository,
        componentRepositoryOrNow?: ComponentRepository | Date,
        now3?: Date
    ) {
        this.calculatorRepository = calculatorRepository;
        if (componentRepositoryOrNow instanceof Date) {
            this.componentRepository = new InMemoryComponentRepository();
            this.now = componentRepositoryOrNow;
        } else if (componentRepositoryOrNow !== undefined) {
            this.componentRepository = componentRepositoryOrNow;
            this.now = now3 ?? new Date();
        } else {
            this.componentRepository = new InMemoryComponentRepository();
            this.now = new Date();
        }
    }

    availableCalculators(): CalculatorView[] {
        return this.calculatorRepository.findAll().map(CalculatorView.from);
    }

    addCalculator(name: string, type: CalculatorType, parameters: Parameters): Calculator {
        const calculator = this.createCalculator(name, type, parameters);
        this.calculatorRepository.save(calculator);
        return calculator;
    }

    calculate(calculatorName: string, parameters: Parameters): Money {
        const calc = this.calculatorRepository.findByName(calculatorName);
        if (!calc) throw new Error(`could not find calculator ${calculatorName}`);
        return calc.calculate(parameters);
    }

    calculateTotal(calculatorName: string, parameters: Parameters): Money {
        const calc = this.calculatorRepository.findByName(calculatorName);
        if (!calc) throw new Error(`could not find calculator ${calculatorName}`);

        let totalCalc: Calculator;
        switch (calc.interpretation()) {
            case Interpretation.TOTAL: totalCalc = calc; break;
            case Interpretation.UNIT: totalCalc = UnitToTotalAdapter.wrap(calc.name() + "-to-total", calc); break;
            case Interpretation.MARGINAL: totalCalc = MarginalToTotalAdapter.wrap(calc.name() + "-to-total", calc); break;
        }
        return totalCalc.calculate(parameters);
    }

    calculateUnitPrice(calculatorName: string, parameters: Parameters): Money {
        const calc = this.calculatorRepository.findByName(calculatorName);
        if (!calc) throw new Error(`could not find calculator ${calculatorName}`);

        let unitCalc: Calculator;
        switch (calc.interpretation()) {
            case Interpretation.UNIT: unitCalc = calc; break;
            case Interpretation.TOTAL: unitCalc = TotalToUnitAdapter.wrap(calc.name() + "-to-unit", calc); break;
            case Interpretation.MARGINAL: unitCalc = MarginalToUnitAdapter.wrap(calc.name() + "-to-unit", calc); break;
        }
        return unitCalc.calculate(parameters);
    }

    calculateMarginal(calculatorName: string, parameters: Parameters): Money {
        const calc = this.calculatorRepository.findByName(calculatorName);
        if (!calc) throw new Error(`could not find calculator ${calculatorName}`);

        let marginalCalc: Calculator;
        switch (calc.interpretation()) {
            case Interpretation.MARGINAL: marginalCalc = calc; break;
            case Interpretation.UNIT: marginalCalc = UnitToMarginalAdapter.wrap(calc.name() + "-to-marginal", calc); break;
            case Interpretation.TOTAL: marginalCalc = TotalToMarginalAdapter.wrap(calc.name() + "-to-marginal", calc); break;
        }
        return marginalCalc.calculate(parameters);
    }

    listCalculatorsWithDescriptions(): Map<CalculatorType, CalculatorView[]> {
        const result = new Map<CalculatorType, CalculatorView[]>();
        for (const calc of this.calculatorRepository.findAll()) {
            const view = CalculatorView.from(calc);
            const existing = result.get(calc.getType()) ?? [];
            existing.push(view);
            result.set(calc.getType(), existing);
        }
        return result;
    }

    availableCalculatorTypes(): CalculatorType[] {
        return Object.values(CalculatorType);
    }

    createSimpleComponent(
        componentName: string,
        calculatorName: string,
        parameterMappingsOrConstraint?: Map<string, string> | Record<string, string> | ApplicabilityConstraint,
        constraintOrValidity?: ApplicabilityConstraint | Validity,
        validity5?: Validity
    ): SimpleComponent {
        let parameterMappings: Map<string, string> | Record<string, string> = {};
        let constraint: ApplicabilityConstraint = alwaysTrue();
        let validity: Validity = Validity.from(this.now);

        if (parameterMappingsOrConstraint !== undefined) {
            if (typeof (parameterMappingsOrConstraint as any).isSatisfiedBy === "function") {
                // (name, calcName, constraint)
                constraint = parameterMappingsOrConstraint as ApplicabilityConstraint;
            } else {
                // (name, calcName, mappings, ...)
                parameterMappings = parameterMappingsOrConstraint as (Map<string, string> | Record<string, string>);
            }
        }

        if (constraintOrValidity !== undefined) {
            if (constraintOrValidity instanceof Validity) {
                validity = constraintOrValidity;
            } else {
                constraint = constraintOrValidity;
            }
        }

        if (validity5 !== undefined) {
            validity = validity5;
        }

        const calculator = this.calculatorRepository.findByName(calculatorName);
        if (!calculator) throw new Error(`Calculator '${calculatorName}' not found`);

        const existing = this.componentRepository.findByName(componentName);
        if (existing) {
            if (!(existing instanceof SimpleComponent)) {
                throw new Error(`Component '${componentName}' exists but is not a SimpleComponent`);
            }
            const newVersion = new SimpleComponentVersion(
                calculator,
                parameterMappings instanceof Map ? parameterMappings : parameterMappings,
                constraint,
                validity,
                this.now
            );
            const updated = existing.updateWith(newVersion);
            this.componentRepository.save(updated);
            return updated;
        }

        const component = SimpleComponent.withInitialVersion(
            componentName, calculator, parameterMappings, constraint, validity, this.now
        );
        this.componentRepository.save(component);
        return component;
    }

    createCompositeComponent(
        compositeName: string,
        depsOrChildNames: Map<string, Map<string, ParameterValue>> | Record<string, Record<string, ParameterValue>> | string,
        ...rest: unknown[]
    ): CompositeComponent {
        let deps: Map<string, Map<string, ParameterValue>>;
        let constraint: ApplicabilityConstraint = alwaysTrue();
        let validity: Validity = Validity.from(this.now);
        let childNames: string[];

        if (typeof depsOrChildNames === "string") {
            // (name, ...childNames)
            deps = new Map();
            childNames = [depsOrChildNames, ...rest.filter(r => typeof r === "string")] as string[];
        } else {
            // Normalize deps
            if (depsOrChildNames instanceof Map) {
                deps = depsOrChildNames;
            } else {
                deps = new Map();
                for (const [key, innerObj] of Object.entries(depsOrChildNames)) {
                    deps.set(key, new Map(Object.entries(innerObj)));
                }
            }

            // Parse rest: could be [constraint, validity, ...names] or [validity, ...names] or [...names]
            let restIdx = 0;
            const restArr = rest as unknown[];

            if (restArr.length > 0 && typeof (restArr[0] as any)?.isSatisfiedBy === "function") {
                constraint = restArr[0] as ApplicabilityConstraint;
                restIdx = 1;
            }

            if (restIdx < restArr.length && restArr[restIdx] instanceof Validity) {
                validity = restArr[restIdx] as Validity;
                restIdx++;
            }

            childNames = restArr.slice(restIdx).filter(r => typeof r === "string") as string[];
        }

        // Look up children
        const children: Component[] = [];
        for (const childName of childNames) {
            const child = this.componentRepository.findByName(childName);
            if (!child) throw new Error(`Component '${childName}' not found`);
            children.push(child);
        }

        // Convert name-based deps to id-based
        const idBasedDeps = new Map<string, Map<string, ParameterValue>>();
        for (const [childName, paramMap] of deps) {
            const child = children.find(c => c.name() === childName);
            if (child) {
                idBasedDeps.set(child.id().id, paramMap);
            }
        }

        const existing = this.componentRepository.findByName(compositeName);
        if (existing) {
            if (!(existing instanceof CompositeComponent)) {
                throw new Error(`Component '${compositeName}' exists but is not a CompositeComponent`);
            }
            const newVersion = new CompositeComponentVersion(
                children, idBasedDeps, constraint, validity, this.now
            );
            const updated = existing.updateWith(newVersion);
            this.componentRepository.save(updated);
            return updated;
        }

        const component = CompositeComponent.withInitialVersion(
            compositeName, children, idBasedDeps, constraint, validity, this.now
        );
        this.componentRepository.save(component);
        return component;
    }

    calculateComponent(componentName: string, parameters: Parameters): Money {
        const component = this.componentRepository.findByName(componentName);
        if (!component) throw new Error(`Component '${componentName}' not found`);
        return component.calculate(parameters);
    }

    calculateComponentBreakdown(componentName: string, parameters: Parameters): ComponentBreakdown {
        const component = this.componentRepository.findByName(componentName);
        if (!component) throw new Error(`Component '${componentName}' not found`);
        return component.calculateBreakdown(parameters);
    }

    private createCalculator(name: string, type: CalculatorType, parameters: Parameters): Calculator {
        const interpretation: Interpretation | null = parameters.contains("interpretation")
            ? parameters.get("interpretation") as Interpretation
            : null;

        switch (type) {
            case CalculatorType.SIMPLE_FIXED:
                return interpretation
                    ? new SimpleFixedCalculator(name, parameters.getMoney("amount"), interpretation)
                    : new SimpleFixedCalculator(name, parameters.getMoney("amount"));

            case CalculatorType.SIMPLE_INTEREST:
                return new SimpleInterestCalculator(name, parameters.getNumber("annualRate"));

            case CalculatorType.STEP_FUNCTION: {
                const stepBoundary = parameters.contains("stepBoundary")
                    ? parameters.get("stepBoundary") as StepBoundary
                    : undefined;
                return new StepFunctionCalculator(
                    name,
                    parameters.getMoney("basePrice"),
                    parameters.getNumber("stepSize"),
                    parameters.getNumber("stepIncrement"),
                    interpretation ?? undefined,
                    stepBoundary
                );
            }

            case CalculatorType.DISCRETE_POINTS: {
                const points = parameters.get("points") as Map<number, Money>;
                return interpretation
                    ? new DiscretePointsCalculator(name, points, interpretation)
                    : new DiscretePointsCalculator(name, points);
            }

            case CalculatorType.DAILY_INCREMENT:
                return interpretation
                    ? new DailyIncrementCalculator(name, parameters.getDate("startDate"), parameters.getMoney("startPrice"), parameters.getMoney("dailyIncrement"), interpretation)
                    : new DailyIncrementCalculator(name, parameters.getDate("startDate"), parameters.getMoney("startPrice"), parameters.getMoney("dailyIncrement"));

            case CalculatorType.CONTINUOUS_LINEAR_TIME:
                return interpretation
                    ? new ContinuousLinearTimeCalculator(name, parameters.getTime("startTime"), parameters.getMoney("startPrice"), parameters.getTime("endTime"), parameters.getMoney("endPrice"), interpretation)
                    : new ContinuousLinearTimeCalculator(name, parameters.getTime("startTime"), parameters.getMoney("startPrice"), parameters.getTime("endTime"), parameters.getMoney("endPrice"));

            case CalculatorType.COMPOSITE: {
                const rangesList = parameters.get("ranges") as CalculatorRange[];
                const rangeSelector = parameters.get("rangeSelector") as string;
                if (!rangeSelector) {
                    throw new Error("COMPOSITE calculator requires 'rangeSelector' parameter");
                }
                const ranges = new Ranges(rangeSelector, rangesList);
                return new CompositeFunctionCalculator(name, ranges, this.calculatorRepository);
            }

            case CalculatorType.PERCENTAGE: {
                const percentageRate = parameters.get("percentageRate") as number;
                return new PercentageCalculator(name, percentageRate);
            }

            default:
                throw new Error(`Calculator type ${type} cannot be created directly`);
        }
    }
}
