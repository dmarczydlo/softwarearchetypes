import { ProcessStep } from './ProcessStep.js';

export class Schedule {
    readonly steps: readonly ProcessStep[];

    constructor(steps: ProcessStep[]) {
        this.steps = Object.freeze([...steps]);
    }

    first(): ProcessStep | null {
        return this.steps.length === 0 ? null : this.steps[0];
    }

    last(): ProcessStep | null {
        return this.steps.length === 0 ? null : this.steps[this.steps.length - 1];
    }

    size(): number {
        return this.steps.length;
    }

    isEmpty(): boolean {
        return this.steps.length === 0;
    }
}
