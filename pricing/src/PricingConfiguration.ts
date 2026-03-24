import { Money } from "@softwarearchetypes/quantity";
import { Calculator } from "./Calculator.js";
import { CalculatorId } from "./CalculatorId.js";
import { Component, SimpleComponent, CompositeComponent } from "./Component.js";
import { ComponentId } from "./ComponentId.js";
import { CompositeComponentVersion } from "./CompositeComponentVersion.js";
import { PricingFacade } from "./PricingFacade.js";
import { Parameters } from "./Parameters.js";

export interface CalculatorRepository {
    save(calculator: Calculator): void;
    findByName(name: string): Calculator | null;
    findById(id: CalculatorId): Calculator | null;
    findAll(): Calculator[];
    findByIds(ids: CalculatorId[]): Calculator[];
}

export interface ComponentRepository {
    save(component: Component): void;
    findByName(name: string): Component | null;
    findById(id: ComponentId): Component | null;
    findAll(): Component[];
    findByNames(names: string[]): Component[];
}

export class InMemoryCalculatorsRepository implements CalculatorRepository {
    private readonly calculators = new Set<Calculator>();

    save(calculator: Calculator): void {
        this.calculators.add(calculator);
    }

    findByName(name: string): Calculator | null {
        for (const c of this.calculators) {
            if (c.name() === name) return c;
        }
        return null;
    }

    findById(id: CalculatorId): Calculator | null {
        for (const c of this.calculators) {
            if (c.getId().equals(id)) return c;
        }
        return null;
    }

    findAll(): Calculator[] {
        return [...this.calculators];
    }

    findByIds(ids: CalculatorId[]): Calculator[] {
        const idSet = new Set(ids.map(id => id.id));
        return [...this.calculators].filter(c => idSet.has(c.getId().id));
    }
}

export class InMemoryComponentRepository implements ComponentRepository {
    private readonly components = new Map<string, Component>();

    save(component: Component): void {
        this.components.set(component.id().id, component);
    }

    findByName(name: string): Component | null {
        for (const c of this.components.values()) {
            if (c.name() === name) {
                return this.refreshComponent(c);
            }
        }
        return null;
    }

    findById(id: ComponentId): Component | null {
        const c = this.components.get(id.id);
        return c ? this.refreshComponent(c) : null;
    }

    findAll(): Component[] {
        return [...this.components.values()].map(c => this.refreshComponent(c));
    }

    findByNames(names: string[]): Component[] {
        const nameSet = new Set(names);
        return [...this.components.values()]
            .filter(c => nameSet.has(c.name()))
            .map(c => this.refreshComponent(c));
    }

    private refreshComponent(component: Component): Component {
        if (!(component instanceof CompositeComponent)) {
            return component;
        }

        const refreshedVersions = component.versions().map(v => this.refreshVersion(v));
        return new CompositeComponent(component.id(), component.name(), refreshedVersions);
    }

    private refreshVersion(version: CompositeComponentVersion): CompositeComponentVersion {
        const freshChildren = version.children
            .map(child => this.components.get(child.id().id))
            .filter((c): c is Component => c !== undefined);

        return new CompositeComponentVersion(
            freshChildren,
            version.dependencies,
            version.applicabilityConstraint,
            version.validity(),
            version.definedAt()
        );
    }
}

export class PricingConfiguration {
    private readonly repository: CalculatorRepository;
    private readonly facade: PricingFacade;

    private constructor(repository: CalculatorRepository, facade: PricingFacade) {
        this.repository = repository;
        this.facade = facade;
    }

    static inMemory(now?: Date): PricingConfiguration {
        const repository = new InMemoryCalculatorsRepository();
        const facade = new PricingFacade(repository, new InMemoryComponentRepository(), now ?? new Date());
        facade.addCalculator("simple-fixed-20", "simple-fixed" as any, Parameters.of("amount", Money.pln(20)));
        facade.addCalculator("simple-interest-6", "simple-interest" as any, Parameters.of("annualRate", 6));
        return new PricingConfiguration(repository, facade);
    }

    pricingFacade(): PricingFacade {
        return this.facade;
    }
}
