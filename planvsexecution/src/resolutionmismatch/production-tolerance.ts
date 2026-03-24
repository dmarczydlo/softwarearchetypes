import { MonthlyProductionPlan } from "./monthly-production-plan";
import { DailyProductionExecution, DailyProductionExecutionHistory } from "./daily-production-execution";

export class ProductionTolerance {

    private readonly allowedDeviation: number;

    constructor(allowedDeviation: number) {
        this.allowedDeviation = allowedDeviation;
    }

    static builder(): ProductionToleranceBuilder {
        return new ProductionToleranceBuilder();
    }

    isWithinTolerance(
        plan: MonthlyProductionPlan,
        execution: DailyProductionExecutionHistory,
        planToDaily: (plan: MonthlyProductionPlan) => DailyProductionExecution[]
    ): boolean {
        const plannedDaily = planToDaily(plan);

        const totalPlanned = plannedDaily.reduce((sum, d) => sum + d.produced, 0);

        const totalActual = execution.days.reduce(
            (sum, day) => sum + day.produced - day.defects + day.rework, 0
        );

        const delta = Math.abs(totalPlanned - totalActual);

        return delta <= this.allowedDeviation;
    }
}

export class ProductionToleranceBuilder {
    private _allowedDeviation: number = 0;

    allowedDeviation(allowedDeviation: number): ProductionToleranceBuilder {
        this._allowedDeviation = allowedDeviation;
        return this;
    }

    build(): ProductionTolerance {
        return new ProductionTolerance(this._allowedDeviation);
    }
}
