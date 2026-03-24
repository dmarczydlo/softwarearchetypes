import { ProcessStep } from '../ProcessStep.js';

export class ExecutionEnvironments {
    readonly stepToEnvironment: ReadonlyMap<ProcessStep, number>;

    constructor(stepToEnvironment: Map<ProcessStep, number>) {
        this.stepToEnvironment = new Map(stepToEnvironment);
    }

    environmentCount(): number {
        let max = -1;
        for (const env of this.stepToEnvironment.values()) {
            if (env > max) max = env;
        }
        return max >= 0 ? max + 1 : 0;
    }

    getEnvironment(step: ProcessStep): number | undefined {
        for (const [s, env] of this.stepToEnvironment) {
            if (s.name === step.name) return env;
        }
        return undefined;
    }

    getStepsInEnvironment(environment: number): Set<ProcessStep> {
        const result = new Set<ProcessStep>();
        for (const [step, env] of this.stepToEnvironment) {
            if (env === environment) {
                result.add(step);
            }
        }
        return result;
    }

    canRunConcurrently(step1: ProcessStep, step2: ProcessStep): boolean {
        const env1 = this.getEnvironment(step1);
        const env2 = this.getEnvironment(step2);
        return env1 !== undefined && env2 !== undefined && env1 === env2;
    }
}
