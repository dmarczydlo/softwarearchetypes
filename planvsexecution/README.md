# @softwarearchetypes/planvsexecution

## What is this archetype?

The plan vs execution archetype provides a framework for comparing planned outcomes against actual results and analyzing deltas. It includes two complete implementations: production analysis (planned vs actual production quantities with tolerance-based matching) and repayment analysis (payment schedules vs actual payments with late/on-time detection). Both support configurable tolerances, plan modification orchestration, and resolution mismatch detection when plan and execution operate at different time granularities.

## When to use this archetype

- You need to compare a plan (schedule, forecast, budget) against actual execution (results, payments, deliveries)
- You want delta analysis: what was overproduced, underproduced, late, or on-time
- You need tolerance-based matching (e.g., production within 5% of plan is acceptable)
- You are tracking repayment schedules vs actual payments (loans, installments, subscriptions)
- You need to handle resolution mismatches (e.g., monthly plan vs daily execution data)
- You want configurable plan modification rules (e.g., if underproduced, increase buffer for next period)
- You are building manufacturing execution systems, financial monitoring, SLA tracking, or delivery scheduling

## Key concepts

### Production Analysis
- **PlannedProduction / ActualProduction** - Planned and actual production records
- **ProductionPlan / ConfigurableProductionPlan** - The plan with expected outputs per period
- **ProductionAnalysisFacade** - Compares plan vs actuals, produces delta results
- **ProductionDeltaResult / ProductionDeltaStatistics** - Delta analysis output with statistics
- **ProductionMatch** - Pairs planned with actual, computing over/under production
- **ProductionToleranceBuilder** - Configures acceptable deviation thresholds
- **PlanModificationOrchestrator** - Adjusts plans based on execution deltas
- **IncreaseBufferModifier / UnderProductionCondition** - Built-in plan modification rules

### Repayment Analysis
- **Payment / PaymentProcessed** - Expected and actual payment records
- **PaymentSchedule / ConfigurablePaymentSchedule** - The repayment plan
- **ScheduleAnalysisFacade** - Compares schedule vs actuals
- **PaymentDeltaResult / PaymentDeltaStatistics** - Delta analysis output
- **PaymentMatch** - Pairs scheduled with actual payments
- **LatePaymentCondition / OnTimePaymentCondition** - Detects late or on-time payments
- **RemoveInstallmentModifier / SpreadRemainingAmountModifier** - Plan adjustment rules

### Resolution Mismatch
- **DailyProductionExecution / MonthlyProductionPlan** - Models for different time granularities
- **ProductionTolerance** - Tolerance configuration for mismatched resolutions

## Installation

```bash
npm install @softwarearchetypes/planvsexecution
```

## Dependencies

- `@softwarearchetypes/quantity`

## Quick example

```typescript
import { ProductionAnalysisFacade, PlannedProduction, ActualProduction } from '@softwarearchetypes/planvsexecution';
import { Quantity, Unit } from '@softwarearchetypes/quantity';

const planned = [
  new PlannedProduction("January", Quantity.of(1000, Unit.of("pcs"))),
  new PlannedProduction("February", Quantity.of(1200, Unit.of("pcs"))),
];

const actual = [
  new ActualProduction("January", Quantity.of(980, Unit.of("pcs"))),
  new ActualProduction("February", Quantity.of(1350, Unit.of("pcs"))),
];

const facade = new ProductionAnalysisFacade();
const delta = facade.analyze(planned, actual);
// Reveals: January slightly under (-2%), February over (+12.5%)
```
