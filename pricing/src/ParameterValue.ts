import { Money } from "@softwarearchetypes/quantity";
import type { Component } from "./Component.js";

export interface ParameterValue {
    evaluate(componentResults: Map<Component, Money | null>): Money;
}

export class ValueOf implements ParameterValue {
    readonly componentName: string;

    constructor(componentName: string) {
        this.componentName = componentName;
    }

    evaluate(componentResults: Map<Component, Money | null>): Money {
        let found: Component | null = null;
        for (const comp of componentResults.keys()) {
            if (comp.name() === this.componentName) {
                found = comp;
                break;
            }
        }
        if (!found) {
            throw new Error(`Component '${this.componentName}' not found`);
        }
        const value = componentResults.get(found);
        if (value === null || value === undefined) {
            throw new Error(`Component '${this.componentName}' has not been calculated yet. Check execution order.`);
        }
        return value;
    }
}

export class SumOf implements ParameterValue {
    readonly componentNames: string[];

    constructor(...componentNames: string[]) {
        this.componentNames = componentNames;
    }

    evaluate(componentResults: Map<Component, Money | null>): Money {
        if (this.componentNames.length === 0) {
            throw new Error("SumOf requires at least one component name");
        }

        let sum: Money | null = null;
        for (const name of this.componentNames) {
            let found: Component | null = null;
            for (const comp of componentResults.keys()) {
                if (comp.name() === name) {
                    found = comp;
                    break;
                }
            }
            if (!found) {
                throw new Error(`Component '${name}' not found`);
            }
            const value = componentResults.get(found);
            if (value === null || value === undefined) {
                throw new Error(`Component '${name}' has not been calculated yet. Check execution order.`);
            }
            sum = sum === null ? value : sum.add(value);
        }
        return sum!;
    }
}

export class DifferenceOf implements ParameterValue {
    constructor(
        readonly minuendComponent: string,
        readonly subtrahendComponent: string
    ) {}

    evaluate(componentResults: Map<Component, Money | null>): Money {
        const findComponent = (name: string): Component => {
            for (const comp of componentResults.keys()) {
                if (comp.name() === name) return comp;
            }
            throw new Error(`Component '${name}' not found`);
        };

        const minuend = findComponent(this.minuendComponent);
        const subtrahend = findComponent(this.subtrahendComponent);

        const minuendValue = componentResults.get(minuend);
        if (minuendValue === null || minuendValue === undefined) {
            throw new Error(`Component '${this.minuendComponent}' has not been calculated yet`);
        }

        const subtrahendValue = componentResults.get(subtrahend);
        if (subtrahendValue === null || subtrahendValue === undefined) {
            throw new Error(`Component '${this.subtrahendComponent}' has not been calculated yet`);
        }

        return minuendValue.subtract(subtrahendValue);
    }
}

export class ProductOf implements ParameterValue {
    constructor(
        readonly componentName: string,
        readonly factor: number
    ) {}

    evaluate(componentResults: Map<Component, Money | null>): Money {
        let found: Component | null = null;
        for (const comp of componentResults.keys()) {
            if (comp.name() === this.componentName) {
                found = comp;
                break;
            }
        }
        if (!found) {
            throw new Error(`Component '${this.componentName}' not found`);
        }
        const value = componentResults.get(found);
        if (value === null || value === undefined) {
            throw new Error(`Component '${this.componentName}' has not been calculated yet`);
        }
        return value.multiply(this.factor);
    }
}
