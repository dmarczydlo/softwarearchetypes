/**
 * Execution: detailed, from bottom up - "270 + 12 defects + 18 rework on days 2,4,7,12"
 */
export class DailyProductionExecution {
    readonly date: Date;
    readonly produced: number;
    readonly defects: number;
    readonly rework: number;

    constructor(date: Date, produced: number, defects: number, rework: number) {
        this.date = date;
        this.produced = produced;
        this.defects = defects;
        this.rework = rework;
    }
}

export class DailyProductionExecutionHistory {
    readonly days: DailyProductionExecution[];

    constructor(days: DailyProductionExecution[]) {
        this.days = days;
    }
}
