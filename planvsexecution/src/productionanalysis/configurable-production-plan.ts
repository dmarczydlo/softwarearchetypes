import { DeltaResult } from "./delta/delta-result";
import { ModificationRule } from "./modification/modification-rule";
import { UnderProductionCondition } from "./modification/under-production-condition";
import { ScheduleModifier } from "./modification/schedule-modifier";
import { ProductionPlan } from "./production-plan";

/**
 * A production plan that can be modified based on delta analysis.
 * This is where SIMULATIONS happen - the plan evolves without changing reality.
 */
export class ConfigurableProductionPlan {

    private _activePlan: ProductionPlan;
    private readonly _rules: ModificationRule[];
    private readonly appliedOnceRules: Set<ModificationRule>;

    /** @internal Use ConfigurableProductionPlan.builder() instead */
    constructor(initialPlan: ProductionPlan, rules: ModificationRule[]) {
        this._activePlan = initialPlan;
        this._rules = [...rules];
        this.appliedOnceRules = new Set();
    }

    activePlan(): ProductionPlan {
        return this._activePlan;
    }

    rules(): ModificationRule[] {
        return [...this._rules];
    }

    fulfilled(fulfilledRules: ModificationRule[], deltaResult: DeltaResult): void {
        for (const rule of fulfilledRules) {
            if (this.alreadyApplied(rule)) {
                continue;
            }

            this._activePlan = rule.modifier.modify(this._activePlan, deltaResult);
            if (rule.applyOnce) {
                this.appliedOnceRules.add(rule);
            }
        }
    }

    private alreadyApplied(rule: ModificationRule): boolean {
        return rule.applyOnce && this.appliedOnceRules.has(rule);
    }

    static builder(): ConfigurableProductionPlanBuilder {
        return new ConfigurableProductionPlanBuilder();
    }
}

export class ConfigurableProductionPlanBuilder {
    private _initialPlan: ProductionPlan | null = null;
    private readonly _rules: ModificationRule[] = [];

    initialPlan(plan: ProductionPlan): ConfigurableProductionPlanBuilder {
        this._initialPlan = plan;
        return this;
    }

    addRule(rule: ModificationRule): ConfigurableProductionPlanBuilder {
        this._rules.push(rule);
        return this;
    }

    onUnderProduction(minQuantity: number, modifier: ScheduleModifier): ConfigurableProductionPlanBuilder {
        return this.addRule(ModificationRule.once(
            UnderProductionCondition.atLeast(minQuantity),
            modifier
        ));
    }

    build(): ConfigurableProductionPlan {
        if (this._initialPlan === null) {
            throw new Error("initialPlan must be set");
        }
        return new ConfigurableProductionPlan(this._initialPlan, this._rules);
    }
}
