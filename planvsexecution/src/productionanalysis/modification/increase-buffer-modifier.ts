import { PlannedProduction } from "../planned-production";
import { ProductionPlan } from "../production-plan";
import { DeltaResult } from "../delta/delta-result";
import { ScheduleModifier } from "./schedule-modifier";

/**
 * Increases production buffer quantities when under-production is detected.
 * Simulation: "what if we planned more to compensate?"
 */
export class IncreaseBufferModifier implements ScheduleModifier {

    private readonly bufferPercentage: number;

    constructor(bufferPercentage: number) {
        this.bufferPercentage = bufferPercentage;
    }

    static by(percentage: number): IncreaseBufferModifier {
        return new IncreaseBufferModifier(percentage);
    }

    modify(currentPlan: ProductionPlan, _deltaResult: DeltaResult): ProductionPlan {
        const modifiedTargets: PlannedProduction[] = [];

        for (const target of currentPlan.targets) {
            const bufferQuantity = Math.floor(target.targetQuantity * this.bufferPercentage / 100);
            const newQuantity = target.targetQuantity + bufferQuantity;

            modifiedTargets.push(new PlannedProduction(
                target.id,
                target.productId,
                newQuantity
            ));
        }

        return ProductionPlan.of(modifiedTargets);
    }
}
