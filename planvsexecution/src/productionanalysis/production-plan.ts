import { PlannedProduction } from "./planned-production";

/**
 * A production plan - collection of planned production targets.
 * This is the PLAN aggregate: "We want to produce these quantities."
 */
export class ProductionPlan {
    readonly targets: PlannedProduction[];

    constructor(targets: PlannedProduction[]) {
        this.targets = [...targets];
    }

    static of(targets: PlannedProduction[]): ProductionPlan {
        return new ProductionPlan(targets);
    }

    static empty(): ProductionPlan {
        return new ProductionPlan([]);
    }

    totalTargetQuantity(): number {
        return this.targets.reduce((sum, t) => sum + t.targetQuantity, 0);
    }

    toString(): string {
        return `ProductionPlan[${this.targets.length} products, total=${this.totalTargetQuantity()} units]`;
    }
}
