import { ScheduleModificationCondition } from "./schedule-modification-condition";
import { PaymentScheduleModifier } from "./payment-schedule-modifier";

export class ModificationRule {
    readonly condition: ScheduleModificationCondition;
    readonly modifier: PaymentScheduleModifier;
    readonly applyOnce: boolean;

    constructor(condition: ScheduleModificationCondition, modifier: PaymentScheduleModifier, applyOnce: boolean) {
        if (condition === null || condition === undefined) {
            throw new Error("condition cannot be null");
        }
        if (modifier === null || modifier === undefined) {
            throw new Error("modifier cannot be null");
        }
        this.condition = condition;
        this.modifier = modifier;
        this.applyOnce = applyOnce;
    }

    static of(condition: ScheduleModificationCondition, modifier: PaymentScheduleModifier): ModificationRule {
        return new ModificationRule(condition, modifier, false);
    }

    static once(condition: ScheduleModificationCondition, modifier: PaymentScheduleModifier): ModificationRule {
        return new ModificationRule(condition, modifier, true);
    }
}
