import { ProcessStep } from '../ProcessStep.js';
import { ExecutionEnvironments } from './ExecutionEnvironments.js';

export class Concurrency {
    static builder(): ConcurrencyBuilder {
        return new ConcurrencyBuilder();
    }
}

export class ConcurrencyBuilder {
    private readonly steps = new Set<string>();
    private readonly stepsByName = new Map<string, ProcessStep>();
    private readonly edges: Array<[string, string]> = [];

    addStep(step: ProcessStep): ConcurrencyBuilder {
        this.steps.add(step.name);
        this.stepsByName.set(step.name, step);
        return this;
    }

    addConflict(step1: ProcessStep, step2: ProcessStep): ConcurrencyBuilder {
        this.addStep(step1);
        this.addStep(step2);
        this.edges.push([step1.name, step2.name]);
        return this;
    }

    build(): ExecutionEnvironments {
        // Greedy graph coloring
        const adjacency = new Map<string, Set<string>>();
        for (const name of this.steps) {
            adjacency.set(name, new Set());
        }
        for (const [a, b] of this.edges) {
            adjacency.get(a)!.add(b);
            adjacency.get(b)!.add(a);
        }

        const colors = new Map<string, number>();
        const vertices = [...this.steps];

        for (const vertex of vertices) {
            const neighborColors = new Set<number>();
            for (const neighbor of adjacency.get(vertex)!) {
                if (colors.has(neighbor)) {
                    neighborColors.add(colors.get(neighbor)!);
                }
            }
            // Find the smallest available color
            let color = 0;
            while (neighborColors.has(color)) {
                color++;
            }
            colors.set(vertex, color);
        }

        const stepToEnv = new Map<ProcessStep, number>();
        for (const [name, color] of colors) {
            stepToEnv.set(this.stepsByName.get(name)!, color);
        }

        return new ExecutionEnvironments(stepToEnv);
    }
}
