import { describe, it, expect } from 'vitest';
import { Process } from './Process.js';
import { DependencyType } from './DependencyType.js';
import { DRYING, MEASUREMENT, ANALYSIS, CALIBRATION, VALIDATION, PREPARATION, FINALIZATION, PATH_1, PATH_2, STEP_1, STEP_2, STEP_3 } from './Fixtures.js';

describe('Schedule', () => {
    it('simple linear process', () => {
        const schedule = Process.builder()
            .addDependency(DRYING, MEASUREMENT, DependencyType.finishToStart('Sample must be dry'))
            .addDependency(MEASUREMENT, ANALYSIS, DependencyType.dataFlow('Spectrum'))
            .build();

        expect(schedule.steps.map(s => s.name)).toEqual([DRYING.name, MEASUREMENT.name, ANALYSIS.name]);
        expect(schedule.first()!.name).toBe(DRYING.name);
        expect(schedule.last()!.name).toBe(ANALYSIS.name);
    });

    it('complex process order', () => {
        const schedule = Process.builder()
            .addDependency(DRYING, MEASUREMENT)
            .addDependency(CALIBRATION, MEASUREMENT)
            .addDependency(MEASUREMENT, ANALYSIS)
            .addDependency(ANALYSIS, VALIDATION)
            .build();

        expect(schedule.size()).toBe(5);
        expect(schedule.last()!.name).toBe(VALIDATION.name);

        const names = schedule.steps.map(s => s.name);
        expect(names.indexOf(DRYING.name)).toBeLessThan(names.indexOf(MEASUREMENT.name));
        expect(names.indexOf(CALIBRATION.name)).toBeLessThan(names.indexOf(MEASUREMENT.name));
        expect(names.indexOf(MEASUREMENT.name)).toBeLessThan(names.indexOf(ANALYSIS.name));
        expect(names.indexOf(ANALYSIS.name)).toBeLessThan(names.indexOf(VALIDATION.name));
    });

    it('single step process', () => {
        const schedule = Process.builder()
            .addStep(DRYING)
            .build();

        expect(schedule.size()).toBe(1);
        expect(schedule.first()!.name).toBe(DRYING.name);
        expect(schedule.last()!.name).toBe(DRYING.name);
    });

    it('diamond pattern', () => {
        const schedule = Process.builder()
            .addDependency(PREPARATION, PATH_1)
            .addDependency(PREPARATION, PATH_2)
            .addDependency(PATH_1, FINALIZATION)
            .addDependency(PATH_2, FINALIZATION)
            .build();

        expect(schedule.size()).toBe(4);
        expect(schedule.first()!.name).toBe(PREPARATION.name);
        expect(schedule.last()!.name).toBe(FINALIZATION.name);

        const names = schedule.steps.map(s => s.name);
        expect(names.indexOf(PREPARATION.name)).toBeLessThan(names.indexOf(PATH_1.name));
        expect(names.indexOf(PREPARATION.name)).toBeLessThan(names.indexOf(PATH_2.name));
        expect(names.indexOf(PATH_1.name)).toBeLessThan(names.indexOf(FINALIZATION.name));
        expect(names.indexOf(PATH_2.name)).toBeLessThan(names.indexOf(FINALIZATION.name));
    });

    it('cyclic dependency is detected', () => {
        expect(() => {
            Process.builder()
                .addDependency(STEP_1, STEP_2)
                .addDependency(STEP_2, STEP_3)
                .addDependency(STEP_3, STEP_1)
                .build();
        }).toThrow();
    });
});
