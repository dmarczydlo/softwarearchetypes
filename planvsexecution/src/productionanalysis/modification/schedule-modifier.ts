import { ProductionPlan } from "../production-plan";
import { DeltaResult } from "../delta/delta-result";

/**
 * Modifier that changes the production plan based on delta analysis.
 * This is where SIMULATIONS happen - we modify the plan without changing reality.
 */
export interface ScheduleModifier {
    modify(currentPlan: ProductionPlan, deltaResult: DeltaResult): ProductionPlan;
}
