import { describe, it, expect } from "vitest";
import { ProductionAnalysisFacade } from "./production-analysis-facade";
import { PlanModificationOrchestrator } from "./plan-modification-orchestrator";
import { ProductionPlan } from "./production-plan";
import { PlannedProduction } from "./planned-production";
import { ActualProduction } from "./actual-production";
import { ConfigurableProductionPlan } from "./configurable-production-plan";
import { IncreaseBufferModifier } from "./modification/increase-buffer-modifier";
import { ToleranceBuilder } from "./tolerance/tolerance-builder";

describe("SimulationScenarios", () => {

    const facade = new ProductionAnalysisFacade();
    const orchestrator = new PlanModificationOrchestrator(facade);

    it("under production triggers buffer increase simulation", () => {
        const initialPlan = ProductionPlan.of([
            PlannedProduction.of("WIDGET-A", 100),
            PlannedProduction.of("WIDGET-B", 200),
            PlannedProduction.of("WIDGET-C", 150),
        ]);

        const configurable = ConfigurableProductionPlan.builder()
            .initialPlan(initialPlan)
            .onUnderProduction(50, IncreaseBufferModifier.by(10.0))
            .build();

        const actual = [
            ActualProduction.of("WIDGET-A", 90),
            ActualProduction.of("WIDGET-B", 150),
        ];

        const tolerance = ToleranceBuilder.exact();
        const result = orchestrator.analyzeAndApply(configurable, actual, tolerance);

        expect(result.statistics.totalUnderProducedQuantity).toBe(450);

        const modifiedPlan = configurable.activePlan();
        expect(modifiedPlan.targets).toHaveLength(3);

        expect(modifiedPlan.targets[0].targetQuantity).toBe(110);
        expect(modifiedPlan.targets[1].targetQuantity).toBe(220);
        expect(modifiedPlan.targets[2].targetQuantity).toBe(165);
    });

    it("simulation does not change reality", () => {
        const originalPlan = ProductionPlan.of([
            PlannedProduction.of("WIDGET-A", 100),
        ]);

        const configurable = ConfigurableProductionPlan.builder()
            .initialPlan(originalPlan)
            .onUnderProduction(30, IncreaseBufferModifier.by(20.0))
            .build();

        const actual = [
            ActualProduction.of("WIDGET-A", 70),
        ];

        const tolerance = ToleranceBuilder.exact();

        const result = orchestrator.analyzeAndApply(configurable, actual, tolerance);

        expect(result.statistics.totalUnderProducedQuantity).toBe(100);
        expect(configurable.activePlan().targets[0].targetQuantity).toBe(120);
        expect(originalPlan.targets[0].targetQuantity).toBe(100);
    });

    it("modification rule applied only once", () => {
        const initialPlan = ProductionPlan.of([
            PlannedProduction.of("WIDGET-A", 100),
        ]);

        const configurable = ConfigurableProductionPlan.builder()
            .initialPlan(initialPlan)
            .onUnderProduction(50, IncreaseBufferModifier.by(10.0))
            .build();

        const tolerance = ToleranceBuilder.exact();

        const firstActual = [
            ActualProduction.of("WIDGET-A", 50),
        ];

        orchestrator.analyzeAndApply(configurable, firstActual, tolerance);
        expect(configurable.activePlan().targets[0].targetQuantity).toBe(110);

        const secondActual = [
            ActualProduction.of("WIDGET-A", 60),
        ];
        orchestrator.analyzeAndApply(configurable, secondActual, tolerance);
        expect(configurable.activePlan().targets[0].targetQuantity).toBe(110);
    });

    it("multiple simulations answer what-if questions", () => {
        const basePlan = ProductionPlan.of([
            PlannedProduction.of("WIDGET-A", 100),
            PlannedProduction.of("WIDGET-B", 200),
        ]);

        const scenario1 = ConfigurableProductionPlan.builder()
            .initialPlan(basePlan)
            .onUnderProduction(40, IncreaseBufferModifier.by(15.0))
            .build();

        const underBy20Percent = [
            ActualProduction.of("WIDGET-A", 80),
            ActualProduction.of("WIDGET-B", 160),
        ];

        orchestrator.analyzeAndApply(scenario1, underBy20Percent, ToleranceBuilder.exact());

        expect(scenario1.activePlan().targets[0].targetQuantity).toBe(115);
        expect(scenario1.activePlan().targets[1].targetQuantity).toBe(230);

        const scenario2 = ConfigurableProductionPlan.builder()
            .initialPlan(basePlan)
            .onUnderProduction(60, IncreaseBufferModifier.by(25.0))
            .build();

        const underBy30Percent = [
            ActualProduction.of("WIDGET-A", 70),
            ActualProduction.of("WIDGET-B", 140),
        ];

        orchestrator.analyzeAndApply(scenario2, underBy30Percent, ToleranceBuilder.exact());

        expect(scenario2.activePlan().targets[0].targetQuantity).toBe(125);
        expect(scenario2.activePlan().targets[1].targetQuantity).toBe(250);
    });
});
