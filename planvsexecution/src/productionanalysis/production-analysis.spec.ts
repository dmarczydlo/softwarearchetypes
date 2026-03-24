import { describe, it, expect } from "vitest";
import { ProductionAnalysisFacade } from "./production-analysis-facade";
import { ProductionPlan } from "./production-plan";
import { PlannedProduction } from "./planned-production";
import { ActualProduction } from "./actual-production";
import { ToleranceBuilder } from "./tolerance/tolerance-builder";

describe("ProductionAnalysisScenarios", () => {

    const facade = new ProductionAnalysisFacade();

    it("exact matching detects quantity deviations", () => {
        const planned = ProductionPlan.of([
            PlannedProduction.of("WIDGET-A", 100),
            PlannedProduction.of("WIDGET-B", 200),
            PlannedProduction.of("WIDGET-C", 150),
        ]);

        const actual = [
            ActualProduction.of("WIDGET-A", 98),
            ActualProduction.of("WIDGET-B", 205),
            ActualProduction.of("WIDGET-C", 150),
        ];

        const exactMatch = ToleranceBuilder.exact();
        const result = facade.analyze(planned, actual, exactMatch);

        expect(result.matched).toHaveLength(1);
        expect(result.unmatchedPlanned).toHaveLength(2);
        expect(result.statistics.totalUnderProducedQuantity).toBe(300);
    });

    it("tolerance strategy allows acceptable deviations", () => {
        const planned = ProductionPlan.of([
            PlannedProduction.of("WIDGET-A", 100),
            PlannedProduction.of("WIDGET-B", 200),
            PlannedProduction.of("WIDGET-C", 150),
        ]);

        const actual = [
            ActualProduction.of("WIDGET-A", 98),
            ActualProduction.of("WIDGET-B", 205),
            ActualProduction.of("WIDGET-C", 148),
        ];

        const lenient = ToleranceBuilder.quantityTolerance(5.0, 10);
        const result = facade.analyze(planned, actual, lenient);

        expect(result.matched).toHaveLength(3);
        expect(result.unmatchedPlanned).toHaveLength(0);
        expect(result.isPerfectMatch()).toBe(false);
    });

    it("split production aggregates partial batches", () => {
        const planned = ProductionPlan.of([
            PlannedProduction.of("WIDGET-A", 500),
        ]);

        const actual = [
            ActualProduction.of("WIDGET-A", 180),
            ActualProduction.of("WIDGET-A", 170),
            ActualProduction.of("WIDGET-A", 155),
        ];

        const tolerance = ToleranceBuilder.quantityTolerance(5.0, 10);
        const result = facade.analyze(planned, actual, tolerance);

        expect(result.matched).toHaveLength(1);
        expect(result.matched[0].actual).toHaveLength(3);
        expect(result.matched[0].totalProducedQuantity()).toBe(505);
        expect(result.isPerfectMatch()).toBe(false);
    });

    it("under production identifies missing output", () => {
        const planned = ProductionPlan.of([
            PlannedProduction.of("WIDGET-A", 100),
            PlannedProduction.of("WIDGET-B", 200),
        ]);

        const actual = [
            ActualProduction.of("WIDGET-A", 100),
        ];

        const tolerance = ToleranceBuilder.exact();
        const result = facade.analyze(planned, actual, tolerance);

        expect(result.hasUnderProduction()).toBe(true);
        expect(result.unmatchedPlanned).toHaveLength(1);
        expect(result.unmatchedPlanned[0].productId).toBe("WIDGET-B");
        expect(result.statistics.totalUnderProducedQuantity).toBe(200);
    });

    it("match rate tracks execution completeness", () => {
        const planned = ProductionPlan.of([
            PlannedProduction.of("WIDGET-A", 100),
            PlannedProduction.of("WIDGET-B", 200),
            PlannedProduction.of("WIDGET-C", 150),
            PlannedProduction.of("WIDGET-D", 180),
            PlannedProduction.of("WIDGET-E", 120),
        ]);

        const actual = [
            ActualProduction.of("WIDGET-A", 100),
            ActualProduction.of("WIDGET-B", 200),
            ActualProduction.of("WIDGET-C", 150),
        ];

        const tolerance = ToleranceBuilder.exact();
        const result = facade.analyze(planned, actual, tolerance);

        expect(result.matchRate()).toBe(0.6);
        expect(result.totalPlannedProducts()).toBe(5);
        expect(result.matched).toHaveLength(3);
        expect(result.unmatchedPlanned).toHaveLength(2);
    });

    it("over production detected", () => {
        const planned = ProductionPlan.of([
            PlannedProduction.of("WIDGET-A", 100),
        ]);

        const actual = [
            ActualProduction.of("WIDGET-A", 150),
        ];

        const tolerance = ToleranceBuilder.exact();
        const result = facade.analyze(planned, actual, tolerance);

        expect(result.hasOverProduction()).toBe(true);
        expect(result.statistics.totalOverProducedQuantity).toBe(150);
        expect(result.statistics.netQuantityDifference).toBe(50);
    });
});
