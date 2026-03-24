import { ScheduleModificationCondition } from "./schedule-modification-condition";

export class OnTimePaymentCondition implements ScheduleModificationCondition {
    readonly _type = "OnTimePaymentCondition";
    readonly minCount: number;

    constructor(minCount: number) {
        if (minCount <= 0) {
            throw new Error("minCount must be > 0");
        }
        this.minCount = minCount;
    }

    static atLeast(count: number): OnTimePaymentCondition {
        return new OnTimePaymentCondition(count);
    }
}

export function isOnTimePaymentCondition(condition: ScheduleModificationCondition): condition is OnTimePaymentCondition {
    return condition._type === "OnTimePaymentCondition";
}
