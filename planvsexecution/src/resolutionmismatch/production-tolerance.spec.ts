import { describe, it, expect } from "vitest";
import { MonthlyProductionPlan } from "./monthly-production-plan";
import { DailyProductionExecution, DailyProductionExecutionHistory } from "./daily-production-execution";
import { ProductionTolerance } from "./production-tolerance";

describe("ProductionToleranceTest", () => {

    const SPLIT_EVENLY_30_DAYS = (plan: MonthlyProductionPlan): DailyProductionExecution[] => {
        const dailyTarget = Math.floor(plan.targetQuantity / 30);
        return Array.from({ length: 30 }, (_, i) => {
            const day = i + 1;
            return new DailyProductionExecution(
                new Date(plan.year, plan.month - 1, day),
                dailyTarget,
                0,
                0
            );
        });
    };

    it("should map monthly plan to daily before calculating delta", () => {
        const plan = new MonthlyProductionPlan(2025, 1, 300);
        const execution = new DailyProductionExecutionHistory([
            new DailyProductionExecution(new Date(2025, 0, 2), 270, 12, 0),
            new DailyProductionExecution(new Date(2025, 0, 4), 18, 0, 0),
            new DailyProductionExecution(new Date(2025, 0, 7), 12, 0, 0),
            new DailyProductionExecution(new Date(2025, 0, 12), 18, 6, 0),
        ]);
        const tolerance = ProductionTolerance.builder()
            .allowedDeviation(10)
            .build();

        const result = tolerance.isWithinTolerance(plan, execution, SPLIT_EVENLY_30_DAYS);

        expect(result).toBe(true);
    });

    it("should detect deviation when actual exceeds tolerance", () => {
        const plan = new MonthlyProductionPlan(2025, 1, 300);
        const execution = new DailyProductionExecutionHistory([
            new DailyProductionExecution(new Date(2025, 0, 2), 270, 12, 0),
            new DailyProductionExecution(new Date(2025, 0, 4), 18, 0, 0),
            new DailyProductionExecution(new Date(2025, 0, 7), 10, 0, 0),
        ]);
        const tolerance = ProductionTolerance.builder()
            .allowedDeviation(10)
            .build();

        const result = tolerance.isWithinTolerance(plan, execution, SPLIT_EVENLY_30_DAYS);

        expect(result).toBe(false);
    });

    it("should show that different mapping strategies give different results", () => {
        const plan = new MonthlyProductionPlan(2025, 1, 300);
        const execution = new DailyProductionExecutionHistory([
            new DailyProductionExecution(new Date(2025, 0, 2), 270, 12, 0),
            new DailyProductionExecution(new Date(2025, 0, 4), 25, 0, 0),
        ]);
        const tolerance = ProductionTolerance.builder()
            .allowedDeviation(20)
            .build();

        const splitWorkdays = (p: MonthlyProductionPlan): DailyProductionExecution[] => {
            const dailyTarget = Math.ceil(p.targetQuantity / 22.0);
            return Array.from({ length: 22 }, (_, i) => {
                const day = i + 1;
                return new DailyProductionExecution(
                    new Date(p.year, p.month - 1, day),
                    dailyTarget,
                    0,
                    0
                );
            });
        };

        const result30Days = tolerance.isWithinTolerance(plan, execution, SPLIT_EVENLY_30_DAYS);
        const resultWorkdays = tolerance.isWithinTolerance(plan, execution, splitWorkdays);

        expect(result30Days).toBe(true);
        expect(resultWorkdays).toBe(false);
    });
});
