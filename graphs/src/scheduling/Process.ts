import { ProcessStep } from './ProcessStep.js';
import { DependencyType } from './DependencyType.js';
import { Schedule } from './Schedule.js';

class EdgeKey {
    constructor(readonly from: ProcessStep, readonly to: ProcessStep) {}
    key(): string {
        return `${this.from.name}|${this.to.name}`;
    }
}

export class Process {
    readonly steps: Set<ProcessStep>;
    private readonly adjacency: Map<string, Set<string>>;
    readonly edgeDependencyTypes: Map<string, DependencyType>;

    constructor(
        steps: Set<ProcessStep>,
        adjacency: Map<string, Set<string>>,
        edgeDependencyTypes: Map<string, DependencyType>
    ) {
        this.steps = steps;
        this.adjacency = adjacency;
        this.edgeDependencyTypes = edgeDependencyTypes;
    }

    static builder(): ProcessBuilder {
        return new ProcessBuilder();
    }
}

export class ProcessBuilder {
    private readonly steps = new Set<ProcessStep>();
    private readonly stepsByName = new Map<string, ProcessStep>();
    private readonly adjacency = new Map<string, Set<string>>();
    private readonly edgeDependencyTypes = new Map<string, DependencyType>();

    addStep(step: ProcessStep): ProcessBuilder {
        this.steps.add(step);
        this.stepsByName.set(step.name, step);
        if (!this.adjacency.has(step.name)) {
            this.adjacency.set(step.name, new Set());
        }
        return this;
    }

    addDependency(from: ProcessStep, to: ProcessStep, dependencyType?: DependencyType): ProcessBuilder {
        this.addStep(from);
        this.addStep(to);
        this.adjacency.get(from.name)!.add(to.name);
        if (dependencyType) {
            const ek = new EdgeKey(from, to);
            this.edgeDependencyTypes.set(ek.key(), dependencyType);
        }
        return this;
    }

    build(): Schedule {
        // Detect cycles and perform topological sort (Kahn's algorithm)
        const inDegree = new Map<string, number>();
        for (const step of this.steps) {
            inDegree.set(step.name, 0);
        }
        for (const [, neighbors] of this.adjacency) {
            for (const neighbor of neighbors) {
                inDegree.set(neighbor, (inDegree.get(neighbor) ?? 0) + 1);
            }
        }

        const queue: string[] = [];
        for (const [name, degree] of inDegree) {
            if (degree === 0) {
                queue.push(name);
            }
        }

        const sorted: ProcessStep[] = [];
        while (queue.length > 0) {
            const current = queue.shift()!;
            sorted.push(this.stepsByName.get(current)!);

            const neighbors = this.adjacency.get(current) ?? new Set<string>();
            for (const neighbor of neighbors) {
                const newDegree = inDegree.get(neighbor)! - 1;
                inDegree.set(neighbor, newDegree);
                if (newDegree === 0) {
                    queue.push(neighbor);
                }
            }
        }

        if (sorted.length !== this.steps.size) {
            throw new Error('Cycle detected in process dependencies');
        }

        return new Schedule(sorted);
    }
}
