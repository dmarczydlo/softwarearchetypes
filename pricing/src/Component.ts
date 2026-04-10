import { Money } from "@softwarearchetypes/quantity";
import { Calculator } from "./Calculator.js";
import { requiredCalculationFields } from "./CalculatorType.js";
import { ComponentBreakdown } from "./ComponentBreakdown.js";
import { ComponentId } from "./ComponentId.js";
import { CompositeComponentVersion } from "./CompositeComponentVersion.js";
import { Interpretation } from "./Interpretation.js";
import { adaptCalculator } from "./InterpretationAdapters.js";
import { ParameterValue } from "./ParameterValue.js";
import { Parameters } from "./Parameters.js";
import { PricingContext } from "./PricingContext.js";
import { SimpleComponentVersion } from "./SimpleComponentVersion.js";
import { Validity } from "./Validity.js";
import { ApplicabilityConstraint, alwaysTrue } from "./ApplicabilityConstraint.js";
import { VersionUpdateStrategy, validateVersionUpdate } from "./VersionUpdateStrategy.js";

export interface Component {
    id(): ComponentId;
    name(): string;
    calculate(parameters: Parameters, targetInterpretation?: Interpretation): Money;
    interpretation(): Interpretation;
    calculateBreakdown(parameters: Parameters, targetInterpretation?: Interpretation): ComponentBreakdown;
}

// ============================================================================
// SimpleComponent
// ============================================================================

export class SimpleComponent implements Component {
    private readonly _id: ComponentId;
    private readonly _name: string;
    private readonly _versions: SimpleComponentVersion[];

    constructor(id: ComponentId, name: string, versions: SimpleComponentVersion[]) {
        if (versions.length === 0) {
            throw new Error("Component must have at least one version");
        }
        this._id = id;
        this._name = name;
        this._versions = [...versions];
    }

    static withInitialVersion(
        name: string,
        calculator: Calculator,
        paramOrValidity: Map<string, string> | Record<string, string> | Validity,
        validityOrConstraintOrNow?: Validity | ApplicabilityConstraint | Date,
        constraintOrNow?: ApplicabilityConstraint | Date,
        now6?: Date
    ): SimpleComponent {
        let parameterMappings: Map<string, string> | Record<string, string>;
        let constraint: ApplicabilityConstraint;
        let validity: Validity;
        let now: Date;

        if (paramOrValidity instanceof Validity) {
            // (name, calc, validity, now)
            parameterMappings = {};
            constraint = alwaysTrue();
            validity = paramOrValidity;
            now = validityOrConstraintOrNow as Date;
        } else if (validityOrConstraintOrNow instanceof Validity) {
            // (name, calc, mappings, validity, now)
            parameterMappings = paramOrValidity;
            constraint = alwaysTrue();
            validity = validityOrConstraintOrNow;
            now = constraintOrNow as Date;
        } else if (constraintOrNow instanceof Date && validityOrConstraintOrNow !== undefined) {
            // (name, calc, mappings, constraint, validity(?), now)
            // This shouldn't happen in this overload
            throw new Error("Unexpected arguments");
        } else if (now6 !== undefined) {
            // (name, calc, mappings, constraint, validity, now)
            parameterMappings = paramOrValidity;
            constraint = validityOrConstraintOrNow as ApplicabilityConstraint;
            validity = constraintOrNow as unknown as Validity;
            now = now6;
        } else {
            throw new Error("Invalid arguments to withInitialVersion");
        }

        const initialVersion = new SimpleComponentVersion(
            calculator, parameterMappings, constraint, validity, now
        );
        return new SimpleComponent(ComponentId.generate(), name, [initialVersion]);
    }

    static of(name: string, calculator: Calculator, parameterMappings?: Map<string, string> | Record<string, string>): SimpleComponent {
        const mappings = parameterMappings ?? {};
        return SimpleComponent.withInitialVersion(name, calculator, mappings, Validity.always(), new Date());
    }

    id(): ComponentId {
        return this._id;
    }

    name(): string {
        return this._name;
    }

    versions(): SimpleComponentVersion[] {
        return [...this._versions];
    }

    interpretation(): Interpretation {
        return this._versions[0].calculator.interpretation();
    }

    updateWith(newVersion: SimpleComponentVersion, strategy: VersionUpdateStrategy = VersionUpdateStrategy.REJECT_IDENTICAL): SimpleComponent {
        validateVersionUpdate(strategy, this._versions, newVersion.validity());
        const updated = [...this._versions, newVersion];
        return new SimpleComponent(this._id, this._name, updated);
    }

    calculate(parameters: Parameters, targetInterpretation?: Interpretation): Money {
        if (targetInterpretation !== undefined) {
            return this.calculateWithTarget(parameters, targetInterpretation);
        }
        return this.calculateBreakdown(parameters).total();
    }

    private calculateWithTarget(parameters: Parameters, targetInterpretation: Interpretation): Money {
        const context = PricingContext.from(parameters);
        const version = this.versionAt(context.timestamp());

        if (!version.isApplicableFor(context)) {
            return Money.pln(0);
        }

        const transformedParams = this.transformParameters(parameters, version.parameterMappings);
        const adaptedCalculator = adaptCalculator(version.calculator, targetInterpretation);
        return adaptedCalculator.calculate(transformedParams);
    }

    calculateBreakdown(parameters: Parameters, targetInterpretation?: Interpretation): ComponentBreakdown {
        const target = targetInterpretation ?? this.interpretation();
        const result = this.calculateWithTarget(parameters, target);
        return new ComponentBreakdown(this._name, result, []);
    }

    requiredParameters(): Set<string> {
        const firstVersion = this._versions[0];
        if (firstVersion.parameterMappings.size > 0) {
            return new Set(firstVersion.parameterMappings.keys());
        }
        return requiredCalculationFields(firstVersion.calculator.getType());
    }

    private versionAt(time: Date): SimpleComponentVersion {
        const validVersions = this._versions.filter(v => v.validity().isValidAt(time));
        if (validVersions.length === 0) {
            throw new Error(`No version of component '${this._name}' (${this._id}) valid at ${time.toISOString()}`);
        }

        // Sort by validFrom DESC, then definedAt DESC
        validVersions.sort((a, b) => {
            const fromDiff = b.validity().validFrom.getTime() - a.validity().validFrom.getTime();
            if (fromDiff !== 0) return fromDiff;
            return b.definedAt().getTime() - a.definedAt().getTime();
        });

        return validVersions[0];
    }

    private transformParameters(original: Parameters, parameterMappings: Map<string, string>): Parameters {
        if (parameterMappings.size === 0) {
            return original;
        }

        let transformed = Parameters.empty();

        // Apply mappings
        for (const [componentParam, calculatorParam] of parameterMappings) {
            if (original.contains(componentParam)) {
                transformed = transformed.with(calculatorParam, original.get(componentParam));
            }
        }

        // Copy unmapped parameters
        for (const key of original.keys()) {
            if (!transformed.contains(key) && !parameterMappings.has(key)) {
                transformed = transformed.with(key, original.get(key));
            }
        }

        return transformed;
    }
}

// ============================================================================
// CompositeComponent
// ============================================================================

export class CompositeComponent implements Component {
    private readonly _id: ComponentId;
    private readonly _name: string;
    private readonly _versions: CompositeComponentVersion[];

    constructor(id: ComponentId, name: string, versions: CompositeComponentVersion[]) {
        if (versions.length === 0) {
            throw new Error("Component must have at least one version");
        }
        this._id = id;
        this._name = name;
        this._versions = [...versions];
    }

    static withInitialVersion(
        name: string,
        children: Component[],
        depsOrValidity: Map<string, Map<string, ParameterValue>> | Validity,
        constraintOrValidityOrNow?: ApplicabilityConstraint | Validity | Date,
        validityOrNow?: Validity | Date,
        now6?: Date
    ): CompositeComponent {
        let deps: Map<string, Map<string, ParameterValue>>;
        let constraint: ApplicabilityConstraint;
        let validity: Validity;
        let now: Date;

        if (depsOrValidity instanceof Validity) {
            // (name, children, validity, now)
            deps = new Map();
            constraint = alwaysTrue();
            validity = depsOrValidity;
            now = constraintOrValidityOrNow as Date;
        } else {
            deps = depsOrValidity;
            if (constraintOrValidityOrNow instanceof Validity) {
                // (name, children, deps, validity, now)
                constraint = alwaysTrue();
                validity = constraintOrValidityOrNow;
                now = validityOrNow as Date;
            } else if (now6 !== undefined) {
                // (name, children, deps, constraint, validity, now)
                constraint = constraintOrValidityOrNow as ApplicabilityConstraint;
                validity = validityOrNow as Validity;
                now = now6;
            } else if (validityOrNow instanceof Date) {
                // (name, children, deps, validity(missing), now)
                constraint = alwaysTrue();
                validity = Validity.always();
                now = validityOrNow;
            } else {
                throw new Error("Invalid arguments to CompositeComponent.withInitialVersion");
            }
        }

        // Convert string-keyed deps to componentId-keyed
        const idDeps = new Map<string, Map<string, ParameterValue>>();
        for (const [key, innerMap] of deps) {
            idDeps.set(key, new Map(innerMap));
        }

        const initialVersion = new CompositeComponentVersion(
            children, idDeps, constraint, validity, now
        );
        return new CompositeComponent(ComponentId.generate(), name, [initialVersion]);
    }

    static of(name: string, ...childrenOrDeps: unknown[]): CompositeComponent {
        // Handle various overloads
        if (childrenOrDeps.length === 1 && Array.isArray(childrenOrDeps[0])) {
            // of(name, children[])
            const children = childrenOrDeps[0] as Component[];
            return CompositeComponent.withInitialVersion(name, children, Validity.always(), new Date());
        }

        // Check if first arg is a Map (dependencies)
        if (childrenOrDeps.length >= 2 && childrenOrDeps[0] instanceof Map) {
            // of(name, deps, children[]) or of(name, deps, ...children)
            const deps = childrenOrDeps[0] as Map<string, Map<string, ParameterValue>>;
            let children: Component[];
            if (Array.isArray(childrenOrDeps[1])) {
                children = childrenOrDeps[1] as Component[];
            } else {
                children = childrenOrDeps.slice(1) as Component[];
            }

            // Convert name-based deps to id-based
            const idDeps = new Map<string, Map<string, ParameterValue>>();
            for (const [childName, paramMap] of deps) {
                idDeps.set(childName, new Map(paramMap));
            }

            const version = new CompositeComponentVersion(
                children, idDeps, Validity.always(), new Date()
            );
            return new CompositeComponent(ComponentId.generate(), name, [version]);
        }

        // of(name, ...children) - all args are Components
        const children = childrenOrDeps as Component[];
        return CompositeComponent.withInitialVersion(name, children, Validity.always(), new Date());
    }

    id(): ComponentId {
        return this._id;
    }

    name(): string {
        return this._name;
    }

    versions(): CompositeComponentVersion[] {
        return [...this._versions];
    }

    interpretation(): Interpretation {
        return Interpretation.TOTAL;
    }

    updateWith(newVersion: CompositeComponentVersion, strategy: VersionUpdateStrategy = VersionUpdateStrategy.REJECT_IDENTICAL): CompositeComponent {
        validateVersionUpdate(strategy, this._versions, newVersion.validity());
        const updated = [...this._versions, newVersion];
        return new CompositeComponent(this._id, this._name, updated);
    }

    calculate(parameters: Parameters, targetInterpretation?: Interpretation): Money {
        const target = targetInterpretation ?? Interpretation.TOTAL;
        const context = PricingContext.from(parameters);
        const version = this.versionAt(context.timestamp());

        if (!version.isApplicableFor(context)) {
            return Money.pln(0);
        }

        if (version.children.length === 0) {
            throw new Error(`Composite component ${this._name} has no children`);
        }

        const componentResults = new Map<Component, Money | null>();
        for (const child of version.children) {
            componentResults.set(child, null);
        }

        let total: Money | null = null;
        for (const child of version.children) {
            const enrichedParams = this.enrichParameters(child, parameters, componentResults, version.dependencies);
            const childResult = child.calculate(enrichedParams, target);
            componentResults.set(child, childResult);
            total = total === null ? childResult : total.add(childResult);
        }

        return total!;
    }

    calculateBreakdown(parameters: Parameters, targetInterpretation?: Interpretation): ComponentBreakdown {
        const target = targetInterpretation ?? this.interpretation();
        const context = PricingContext.from(parameters);
        const version = this.versionAt(context.timestamp());

        if (!version.isApplicableFor(context)) {
            return new ComponentBreakdown(this._name, Money.pln(0), []);
        }

        if (version.children.length === 0) {
            throw new Error(`Composite component ${this._name} has no children`);
        }

        const componentResults = new Map<Component, Money | null>();
        for (const child of version.children) {
            componentResults.set(child, null);
        }

        const childBreakdowns: ComponentBreakdown[] = [];
        let total: Money | null = null;

        for (const child of version.children) {
            const enrichedParams = this.enrichParameters(child, parameters, componentResults, version.dependencies);
            const childBreakdown = child.calculateBreakdown(enrichedParams, target);
            componentResults.set(child, childBreakdown.total());
            childBreakdowns.push(childBreakdown);
            total = total === null ? childBreakdown.total() : total.add(childBreakdown.total());
        }

        return new ComponentBreakdown(this._name, total!, childBreakdowns);
    }

    private versionAt(time: Date): CompositeComponentVersion {
        const validVersions = this._versions.filter(v => v.validity().isValidAt(time));
        if (validVersions.length === 0) {
            throw new Error(`No version of component '${this._name}' (${this._id}) valid at ${time.toISOString()}`);
        }

        validVersions.sort((a, b) => {
            const fromDiff = b.validity().validFrom.getTime() - a.validity().validFrom.getTime();
            if (fromDiff !== 0) return fromDiff;
            return b.definedAt().getTime() - a.definedAt().getTime();
        });

        return validVersions[0];
    }

    private enrichParameters(
        child: Component,
        baseParameters: Parameters,
        componentResults: Map<Component, Money | null>,
        dependencies: Map<string, Map<string, ParameterValue>>
    ): Parameters {
        const childDependencies = dependencies.get(child.id().toString()) ?? dependencies.get(child.name());

        if (!childDependencies || childDependencies.size === 0) {
            return baseParameters;
        }

        let enriched = baseParameters;
        for (const [targetParamName, expression] of childDependencies) {
            const value = expression.evaluate(componentResults);
            enriched = enriched.with(targetParamName, value);
        }

        return enriched;
    }
}
