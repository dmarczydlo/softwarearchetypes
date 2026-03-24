import { ScheduleModificationCondition } from "./schedule-modification-condition";

export class LatePaymentCondition implements ScheduleModificationCondition {
    readonly _type = "LatePaymentCondition";
    readonly minCount: number;

    constructor(minCount: number) {
        if (minCount <= 0) {
            throw new Error("minCount must be > 0");
        }
        this.minCount = minCount;
    }

    static atLeast(count: number): LatePaymentCondition {
        return new LatePaymentCondition(count);
    }
}

export function isLatePaymentCondition(condition: ScheduleModificationCondition): condition is LatePaymentCondition {
    return condition._type === "LatePaymentCondition";
}
