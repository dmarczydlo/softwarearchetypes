import { describe, it, expect } from 'vitest';
import { ProcessStep } from '../ProcessStep.js';
import { Concurrency } from './Concurrency.js';

const MEASUREMENT = new ProcessStep('Measurement');
const CALIBRATION = new ProcessStep('Calibration');
const VALIDATION = new ProcessStep('Validation');
const FINAL_TEST = new ProcessStep('Final Test');

describe('Concurrency', () => {
    it('laboratory steps require minimal 3 environments', () => {
        const environments = Concurrency.builder()
            .addConflict(MEASUREMENT, CALIBRATION)
            .addConflict(MEASUREMENT, VALIDATION)
            .addConflict(FINAL_TEST, MEASUREMENT)
            .addConflict(FINAL_TEST, CALIBRATION)
            .addConflict(FINAL_TEST, VALIDATION)
            .build();

        expect(environments.environmentCount()).toBe(3);
        expect(environments.canRunConcurrently(CALIBRATION, VALIDATION)).toBe(true);
        expect(environments.canRunConcurrently(MEASUREMENT, CALIBRATION)).toBe(false);
        expect(environments.canRunConcurrently(MEASUREMENT, VALIDATION)).toBe(false);
        expect(environments.canRunConcurrently(FINAL_TEST, MEASUREMENT)).toBe(false);
        expect(environments.canRunConcurrently(FINAL_TEST, CALIBRATION)).toBe(false);
        expect(environments.canRunConcurrently(FINAL_TEST, VALIDATION)).toBe(false);
    });

    it('no conflicts requires one environment', () => {
        const step1 = new ProcessStep('Step 1');
        const step2 = new ProcessStep('Step 2');
        const step3 = new ProcessStep('Step 3');

        const environments = Concurrency.builder()
            .addStep(step1)
            .addStep(step2)
            .addStep(step3)
            .build();

        expect(environments.environmentCount()).toBe(1);
        expect(environments.canRunConcurrently(step1, step2)).toBe(true);
        expect(environments.canRunConcurrently(step2, step3)).toBe(true);
        expect(environments.canRunConcurrently(step1, step3)).toBe(true);
    });

    it('complete conflict graph requires max environments', () => {
        const step1 = new ProcessStep('Step 1');
        const step2 = new ProcessStep('Step 2');
        const step3 = new ProcessStep('Step 3');

        const environments = Concurrency.builder()
            .addConflict(step1, step2)
            .addConflict(step1, step3)
            .addConflict(step2, step3)
            .build();

        expect(environments.environmentCount()).toBe(3);
        expect(environments.canRunConcurrently(step1, step2)).toBe(false);
        expect(environments.canRunConcurrently(step1, step3)).toBe(false);
        expect(environments.canRunConcurrently(step2, step3)).toBe(false);
    });

    it('chain conflicts require two environments', () => {
        const stepA = new ProcessStep('Step A');
        const stepB = new ProcessStep('Step B');
        const stepC = new ProcessStep('Step C');

        const environments = Concurrency.builder()
            .addConflict(stepA, stepB)
            .addConflict(stepB, stepC)
            .build();

        expect(environments.environmentCount()).toBe(2);
        expect(environments.canRunConcurrently(stepA, stepB)).toBe(false);
        expect(environments.canRunConcurrently(stepB, stepC)).toBe(false);
        expect(environments.canRunConcurrently(stepA, stepC)).toBe(true);
    });
});
