import { ScheduleModificationCondition } from "./schedule-modification-condition";
import { ScheduleModifier } from "./schedule-modifier";

/**
 * A rule that combines a condition with a modification action.
 * When condition is fulfilled, the modifier is applied.
 */
export class ModificationRule {
    readonly condition: ScheduleModificationCondition;
    readonly modifier: ScheduleModifier;
    readonly applyOnce: boolean;

    constructor(condition: ScheduleModificationCondition, modifier: ScheduleModifier, applyOnce: boolean) {
        this.condition = condition;
        this.modifier = modifier;
        this.applyOnce = applyOnce;
    }

    static once(condition: ScheduleModificationCondition, modifier: ScheduleModifier): ModificationRule {
        return new ModificationRule(condition, modifier, true);
    }

    static always(condition: ScheduleModificationCondition, modifier: ScheduleModifier): ModificationRule {
        return new ModificationRule(condition, modifier, false);
    }
}
