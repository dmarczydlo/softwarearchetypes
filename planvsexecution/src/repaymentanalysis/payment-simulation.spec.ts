import { describe, it, expect } from "vitest";
import { Money } from "@softwarearchetypes/quantity";
import { ScheduleAnalysisConfiguration } from "./schedule-analysis-configuration";
import { ScheduleModificationOrchestrator } from "./schedule-modification-orchestrator";
import { PaymentSchedule } from "./payment-schedule";
import { Payment } from "./payment";
import { PaymentProcessed } from "./payment-processed";
import { ConfigurablePaymentSchedule } from "./configurable-payment-schedule";
import { SpreadRemainingAmountModifier } from "./modification/spread-remaining-amount-modifier";
import { RemoveInstallmentModifier } from "./modification/remove-installment-modifier";
import { ModificationRule } from "./modification/modification-rule";
import { OnTimePaymentCondition } from "./modification/on-time-payment-condition";
import { ToleranceBuilder } from "./tolerance/tolerance-builder";
import { instantUTC } from "./test-instants";

describe("PaymentSimulationScenarios", () => {

    const facade = ScheduleAnalysisConfiguration.facade();
    const orchestrator = new ScheduleModificationOrchestrator(facade);

    it("simulation three on time payments removes one installment", () => {
        const planned = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 4, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 5, 15, 0, 0), Money.pln(100.00)),
        ]);

        const execution: PaymentProcessed[] = [
            PaymentProcessed.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00), new Date()),
            PaymentProcessed.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00), new Date()),
            PaymentProcessed.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00), new Date()),
        ];

        const configurable = ConfigurablePaymentSchedule.builder()
            .initialSchedule(planned)
            .onOnTimePayment(3, new RemoveInstallmentModifier(3))
            .build();

        const strategy = ToleranceBuilder.exact();

        orchestrator.analyzeAndApplyFromEvents(configurable, execution, strategy);

        expect(configurable.activeSchedule().size()).toBe(4);
        expect(configurable.activeSchedule().totalAmount().equals(Money.pln(400.00))).toBe(true);
    });

    it("simulation one late payment shortens remaining schedule", () => {
        const planned = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 4, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 5, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 6, 15, 0, 0), Money.pln(100.00)),
        ]);

        const events: PaymentProcessed[] = [
            PaymentProcessed.of(instantUTC(2024, 1, 20, 0, 0), Money.pln(100.00), new Date()),
        ];

        const configurable = ConfigurablePaymentSchedule.builder()
            .initialSchedule(planned)
            .onLatePayment(1, new SpreadRemainingAmountModifier(3))
            .build();

        const strategy = ToleranceBuilder.tolerance()
            .money(Money.pln(0.01))
            .days(10)
            .build();

        orchestrator.analyzeAndApplyFromEvents(configurable, events, strategy);

        expect(configurable.activeSchedule().size()).toBe(4);
        expect(configurable.activeSchedule().totalAmount().equals(Money.pln(600.00))).toBe(true);
        expect(configurable.activeSchedule().payments[0].amount.equals(Money.pln(100.00))).toBe(true);
    });

    it("simulation partial payments count as on time", () => {
        const planned = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 4, 15, 0, 0), Money.pln(100.00)),
        ]);

        const events: PaymentProcessed[] = [
            PaymentProcessed.of(instantUTC(2024, 1, 10, 0, 0), Money.pln(50.00), new Date()),
            PaymentProcessed.of(instantUTC(2024, 1, 14, 0, 0), Money.pln(50.00), new Date()),
        ];

        const configurable = ConfigurablePaymentSchedule.builder()
            .initialSchedule(planned)
            .onOnTimePayment(1, new RemoveInstallmentModifier(1))
            .build();

        const strategy = ToleranceBuilder.partialPayments(
            Money.pln(0.05),
            instantUTC(2024, 1, 15, 0, 0)
        );

        const result = orchestrator.analyzeAndApplyFromEvents(configurable, events, strategy);

        expect(result.statistics.onTimeCount).toBe(1);
        expect(configurable.activeSchedule().size()).toBe(3);
        expect(configurable.activeSchedule().totalAmount().equals(Money.pln(300.00))).toBe(true);
    });

    it("simulation 5 gross tolerance counts as paid", () => {
        const planned = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 4, 15, 0, 0), Money.pln(100.00)),
        ]);

        const events: PaymentProcessed[] = [
            PaymentProcessed.of(instantUTC(2024, 1, 14, 0, 0), Money.pln(99.96), new Date()),
            PaymentProcessed.of(instantUTC(2024, 2, 14, 0, 0), Money.pln(99.99), new Date()),
        ];

        const configurable = ConfigurablePaymentSchedule.builder()
            .initialSchedule(planned)
            .onOnTimePayment(1, new RemoveInstallmentModifier(1))
            .build();

        const strategy = ToleranceBuilder.moneyTolerance(Money.pln(0.05));

        const result = orchestrator.analyzeAndApplyFromEvents(configurable, events, strategy);

        expect(result.statistics.onTimeCount).toBe(2);
    });

    it("simulation mixed payments trigger multiple rules", () => {
        const planned = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 4, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 5, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 6, 15, 0, 0), Money.pln(100.00)),
        ]);

        const events: PaymentProcessed[] = [
            PaymentProcessed.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00), new Date()),
            PaymentProcessed.of(instantUTC(2024, 2, 22, 0, 0), Money.pln(100.00), new Date()),
            PaymentProcessed.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00), new Date()),
        ];

        const configurable = ConfigurablePaymentSchedule.builder()
            .initialSchedule(planned)
            .onOnTimePayment(2, new RemoveInstallmentModifier(3))
            .onLatePayment(1, new SpreadRemainingAmountModifier(2))
            .build();

        const strategy = ToleranceBuilder.tolerance()
            .money(Money.pln(0.01))
            .days(10)
            .build();

        const result = orchestrator.analyzeAndApplyFromEvents(configurable, events, strategy);

        expect(result.statistics.onTimeCount).toBe(2);
        expect(result.statistics.lateCount).toBe(1);
        expect(configurable.activeSchedule().size()).toBe(5);
        expect(configurable.activeSchedule().totalAmount().equals(Money.pln(500.00))).toBe(true);
    });

    it("simulation no payments schedule unchanged", () => {
        const planned = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00)),
        ]);

        const events: PaymentProcessed[] = [];

        const configurable = ConfigurablePaymentSchedule.builder()
            .initialSchedule(planned)
            .onOnTimePayment(1, new RemoveInstallmentModifier(1))
            .onLatePayment(1, new SpreadRemainingAmountModifier(1))
            .build();

        const strategy = ToleranceBuilder.exact();

        orchestrator.analyzeAndApplyFromEvents(configurable, events, strategy);

        expect(configurable.activeSchedule().size()).toBe(3);
        expect(configurable.activeSchedule().totalAmount().equals(Money.pln(300.00))).toBe(true);
        expect(configurable.activeSchedule().equals(planned)).toBe(true);
    });

    it("simulation progressive schedule modification over time", () => {
        const planned = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 4, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 5, 15, 0, 0), Money.pln(100.00)),
        ]);

        const configurable = ConfigurablePaymentSchedule.builder()
            .initialSchedule(planned)
            .onOnTimePayment(1, new RemoveInstallmentModifier(1))
            .build();

        const strategy = ToleranceBuilder.exact();

        const firstPayment: PaymentProcessed[] = [
            PaymentProcessed.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00), new Date()),
        ];
        orchestrator.analyzeAndApplyFromEvents(configurable, firstPayment, strategy);

        const sizeAfterFirst = configurable.activeSchedule().size();

        const secondPayment: PaymentProcessed[] = [
            PaymentProcessed.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00), new Date()),
            PaymentProcessed.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00), new Date()),
        ];
        orchestrator.analyzeAndApplyFromEvents(configurable, secondPayment, strategy);

        const sizeAfterSecond = configurable.activeSchedule().size();

        expect(sizeAfterFirst).toBe(4);
        expect(sizeAfterSecond).toBe(4);
        expect(configurable.activeSchedule().totalAmount().equals(Money.pln(400.00))).toBe(true);
    });

    it("simulation all payments on time removes last installment", () => {
        const planned = PaymentSchedule.of([
            Payment.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00)),
            Payment.of(instantUTC(2024, 4, 15, 0, 0), Money.pln(100.00)),
        ]);

        const events: PaymentProcessed[] = [
            PaymentProcessed.of(instantUTC(2024, 1, 15, 0, 0), Money.pln(100.00), new Date()),
            PaymentProcessed.of(instantUTC(2024, 2, 15, 0, 0), Money.pln(100.00), new Date()),
            PaymentProcessed.of(instantUTC(2024, 3, 15, 0, 0), Money.pln(100.00), new Date()),
            PaymentProcessed.of(instantUTC(2024, 4, 15, 0, 0), Money.pln(100.00), new Date()),
        ];

        const configurable = ConfigurablePaymentSchedule.builder()
            .initialSchedule(planned)
            .addRule(ModificationRule.once(
                OnTimePaymentCondition.atLeast(4),
                new RemoveInstallmentModifier(3)
            ))
            .build();

        const strategy = ToleranceBuilder.exact();

        const result = orchestrator.analyzeAndApplyFromEvents(configurable, events, strategy);

        expect(result.isPerfectMatch()).toBe(true);
        expect(result.statistics.onTimeCount).toBe(4);
        expect(configurable.activeSchedule().size()).toBe(3);
        expect(configurable.activeSchedule().totalAmount().equals(Money.pln(300.00))).toBe(true);
    });
});
