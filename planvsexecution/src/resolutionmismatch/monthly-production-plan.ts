/**
 * Plan: simplified, from top down - "300 units in a month"
 */
export class MonthlyProductionPlan {
    readonly year: number;
    readonly month: number;
    readonly targetQuantity: number;

    constructor(year: number, month: number, targetQuantity: number) {
        this.year = year;
        this.month = month;
        this.targetQuantity = targetQuantity;
    }
}
