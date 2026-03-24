import { describe, it, expect } from "vitest";
import { Money } from "@softwarearchetypes/quantity";
import { ScheduleAnalysisConfiguration } from "./schedule-analysis-configuration";
import { PaymentSchedule } from "./payment-schedule";
import { Payment } from "./payment";
import { ToleranceBuilder } from "./tolerance/tolerance-builder";
import { instantUTC } from "./test-instants";

describe("PaymentScheduleAnalysisScenarios", () => {

    const facade = ScheduleAnalysisConfiguration.facade();

    it("exact matching identifies penny deviations", () => {
        const planned = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00)),
        ]);
        const actual = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(99.95)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.03)),
            Payment.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00)),
        ]);

        const exactMatch = ToleranceBuilder.exact();
        const result = facade.analyze(planned, actual, exactMatch);

        expect(result.matched).toHaveLength(1);
        expect(result.unmatchedPlanned).toHaveLength(2);
        expect(result.statistics.totalUnderpaidAmount.equals(Money.pln(200.00))).toBe(true);
    });

    it("five groszy tolerance matches penny deviations", () => {
        const planned = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00)),
        ]);
        const actual = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(99.95)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.03)),
            Payment.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00)),
        ]);

        const lenient = ToleranceBuilder.fiveGroszy();
        const result = facade.analyze(planned, actual, lenient);

        expect(result.matched).toHaveLength(3);
        expect(result.unmatchedPlanned).toHaveLength(0);
        expect(result.isPerfectMatch()).toBe(true);
    });

    it("partial payments sum to installment", () => {
        const planned = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
        ]);
        const actual = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 10, 0, 0), Money.pln(40.00)),
            Payment.of(instantUTC(2024, 1, 12, 0, 0), Money.pln(30.00)),
            Payment.of(instantUTC(2024, 1, 14, 0, 0), Money.pln(30.00)),
        ]);

        const partials = ToleranceBuilder.partialPayments(
            Money.pln(0.05),
            instantUTC(2024, 1, 15, 0, 0)
        );
        const result = facade.analyze(planned, actual, partials);

        expect(result.matched).toHaveLength(1);
        expect(result.matched[0].actual).toHaveLength(3);
        expect(result.matched[0].totalActualAmount().equals(Money.pln(100.00))).toBe(true);
        expect(result.isPerfectMatch()).toBe(true);
    });

    it("on time and late payments tracked", () => {
        const planned = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00)),
        ]);
        const actual = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 14, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 20, 0, 0), Money.pln(100.00)),
        ]);

        const strategy = ToleranceBuilder.tolerance()
            .money(Money.pln(0.01))
            .days(10)
            .build();
        const result = facade.analyze(planned, actual, strategy);

        expect(result.statistics.onTimeCount).toBe(1);
        expect(result.statistics.lateCount).toBe(1);
    });
});
