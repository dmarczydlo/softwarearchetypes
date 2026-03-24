import { DeltaResult } from "./delta/delta-result";
import { ModificationRule } from "./modification/modification-rule";
import { LatePaymentCondition } from "./modification/late-payment-condition";
import { OnTimePaymentCondition } from "./modification/on-time-payment-condition";
import { PaymentScheduleModifier } from "./modification/payment-schedule-modifier";
import { PaymentSchedule } from "./payment-schedule";

export class ConfigurablePaymentSchedule {

    private _activeSchedule: PaymentSchedule;
    private readonly _rules: ModificationRule[];
    private readonly appliedOnceRules: Set<ModificationRule>;

    /** @internal Use ConfigurablePaymentSchedule.builder() instead */
    constructor(initialSchedule: PaymentSchedule, rules: ModificationRule[]) {
        this._activeSchedule = initialSchedule;
        this._rules = [...rules];
        this.appliedOnceRules = new Set();
    }

    activeSchedule(): PaymentSchedule {
        return this._activeSchedule;
    }

    rules(): ModificationRule[] {
        return [...this._rules];
    }

    fulfilled(fulfilledRules: ModificationRule[], deltaResult: DeltaResult): ConfigurablePaymentSchedule {
        for (const rule of fulfilledRules) {
            if (this.alreadyApplied(rule)) {
                continue;
            }

            this._activeSchedule = rule.modifier.modify(this._activeSchedule, deltaResult);
            if (rule.applyOnce) {
                this.appliedOnceRules.add(rule);
            }
        }
        return this;
    }

    private alreadyApplied(rule: ModificationRule): boolean {
        return rule.applyOnce && this.appliedOnceRules.has(rule);
    }

    static builder(): ConfigurablePaymentScheduleBuilder {
        return new ConfigurablePaymentScheduleBuilder();
    }
}

export class ConfigurablePaymentScheduleBuilder {
    private _initialSchedule: PaymentSchedule | null = null;
    private readonly _rules: ModificationRule[] = [];

    initialSchedule(schedule: PaymentSchedule): ConfigurablePaymentScheduleBuilder {
        this._initialSchedule = schedule;
        return this;
    }

    addRule(rule: ModificationRule): ConfigurablePaymentScheduleBuilder {
        this._rules.push(rule);
        return this;
    }

    onLatePayment(count: number, modifier: PaymentScheduleModifier): ConfigurablePaymentScheduleBuilder {
        return this.addRule(ModificationRule.once(
            LatePaymentCondition.atLeast(count),
            modifier
        ));
    }

    onOnTimePayment(count: number, modifier: PaymentScheduleModifier): ConfigurablePaymentScheduleBuilder {
        return this.addRule(ModificationRule.once(
            OnTimePaymentCondition.atLeast(count),
            modifier
        ));
    }

    build(): ConfigurablePaymentSchedule {
        if (this._initialSchedule === null) {
            throw new Error("initialSchedule must be set");
        }
        return new ConfigurablePaymentSchedule(this._initialSchedule, this._rules);
    }
}
