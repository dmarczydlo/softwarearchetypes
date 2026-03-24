import { ScheduleModificationCondition } from "./schedule-modification-condition";

/**
 * Condition triggered when under-production exceeds a threshold.
 */
export class UnderProductionCondition implements ScheduleModificationCondition {
    readonly _type = "UnderProductionCondition";
    readonly minQuantity: number;

    constructor(minQuantity: number) {
        this.minQuantity = minQuantity;
    }

    static atLeast(minQuantity: number): UnderProductionCondition {
        return new UnderProductionCondition(minQuantity);
    }
}

export function isUnderProductionCondition(condition: ScheduleModificationCondition): condition is UnderProductionCondition {
    return condition._type === "UnderProductionCondition";
}
