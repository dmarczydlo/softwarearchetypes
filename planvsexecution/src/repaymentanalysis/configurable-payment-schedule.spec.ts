import { describe, it, expect } from "vitest";
import { Money } from "@softwarearchetypes/quantity";
import { ScheduleAnalysisConfiguration } from "./schedule-analysis-configuration";
import { ScheduleModificationOrchestrator } from "./schedule-modification-orchestrator";
import { PaymentSchedule } from "./payment-schedule";
import { Payment } from "./payment";
import { ConfigurablePaymentSchedule } from "./configurable-payment-schedule";
import { SpreadRemainingAmountModifier } from "./modification/spread-remaining-amount-modifier";
import { RemoveInstallmentModifier } from "./modification/remove-installment-modifier";
import { ModificationRule } from "./modification/modification-rule";
import { OnTimePaymentCondition } from "./modification/on-time-payment-condition";
import { LatePaymentCondition } from "./modification/late-payment-condition";
import { ToleranceBuilder } from "./tolerance/tolerance-builder";
import { instantUTC } from "./test-instants";

describe("ConfigurablePaymentScheduleScenarios", () => {

    const facade = ScheduleAnalysisConfiguration.facade();
    const orchestrator = new ScheduleModificationOrchestrator(facade);

    it("late payment triggers schedule shortening", () => {
        const planned = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 4, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 5, 15, 0, 0), Money.pln(100.00)),
        ]);

        const actual = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 20, 0, 0), Money.pln(100.00)),
        ]);

        const configurable = ConfigurablePaymentSchedule.builder()
            .initialSchedule(planned)
            .onLatePayment(1, new SpreadRemainingAmountModifier(3))
            .build();

        const strategy = ToleranceBuilder.tolerance()
            .money(Money.pln(0.01))
            .days(10)
            .build();
        const result = orchestrator.analyzeAndApply(configurable, actual, strategy);

        expect(result.statistics.lateCount).toBe(1);
        expect(configurable.activeSchedule().size()).toBe(4);
        expect(configurable.activeSchedule().totalAmount().equals(Money.pln(500.00))).toBe(true);
    });

    it("on time payment triggers installment removal", () => {
        const planned = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00)),
        ]);

        const actual = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
        ]);

        const configurable = ConfigurablePaymentSchedule.builder()
            .initialSchedule(planned)
            .onOnTimePayment(1, new RemoveInstallmentModifier(1))
            .build();

        const strategy = ToleranceBuilder.exact();
        const result = orchestrator.analyzeAndApply(configurable, actual, strategy);

        expect(result.statistics.onTimeCount).toBe(1);
        expect(configurable.activeSchedule().size()).toBe(2);
        expect(configurable.activeSchedule().totalAmount().equals(Money.pln(200.00))).toBe(true);
    });

    it("multiple rules can be applied", () => {
        const planned = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 4, 15, 0, 0), Money.pln(100.00)),
        ]);

        const actual = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 20, 0, 0), Money.pln(100.00)),
        ]);

        const configurable = ConfigurablePaymentSchedule.builder()
            .initialSchedule(planned)
            .addRule(ModificationRule.once(
                OnTimePaymentCondition.atLeast(1),
                new RemoveInstallmentModifier(2)
            ))
            .addRule(ModificationRule.once(
                LatePaymentCondition.atLeast(1),
                new SpreadRemainingAmountModifier(1)
            ))
            .build();

        const strategy = ToleranceBuilder.tolerance()
            .money(Money.pln(0.01))
            .days(10)
            .build();
        const result = orchestrator.analyzeAndApply(configurable, actual, strategy);

        expect(result.statistics.onTimeCount).toBe(1);
        expect(result.statistics.lateCount).toBe(1);
        expect(configurable.activeSchedule().size()).toBe(3);
    });

    it("spread remaining amount preserves total", () => {
        const planned = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 4, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 5, 15, 0, 0), Money.pln(100.00)),
        ]);

        const modifier = new SpreadRemainingAmountModifier(2);

        const actual = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
        ]);
        const deltaResult = facade.analyze(planned, actual, ToleranceBuilder.exact());

        const modified = modifier.modify(planned, deltaResult);

        expect(modified.size()).toBe(3);
        expect(modified.totalAmount().equals(Money.pln(500.00))).toBe(true);
    });

    it("remove installment modifier works", () => {
        const planned = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00)),
        ]);

        const modifier = new RemoveInstallmentModifier(1);

        const actual = PaymentSchedule.empty();
        const deltaResult = facade.analyze(planned, actual, ToleranceBuilder.exact());

        const modified = modifier.modify(planned, deltaResult);

        expect(modified.size()).toBe(2);
        expect(modified.payments[0].amount.equals(Money.pln(100.00))).toBe(true);
        expect(modified.payments[1].amount.equals(Money.pln(100.00))).toBe(true);
        expect(modified.payments[0].when.getTime()).toBe(instantUTC(2024, 1, 15, 0, 0).getTime());
        expect(modified.payments[1].when.getTime()).toBe(instantUTC(2024, 3, 15, 0, 0).getTime());
    });
});
