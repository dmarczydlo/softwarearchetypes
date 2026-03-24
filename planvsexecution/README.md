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

Clone the repository and install locally:

```bash
git clone <repo-url> archetypes-typescript
cd archetypes-typescript
npm install
```

Then link the archetype into your project:

```bash
npm install ../archetypes-typescript/planvsexecution
```

## Dependencies

- `@softwarearchetypes/quantity`

## Quick example

### Production analysis with tolerance

```typescript
import {
  ProductionAnalysisFacade,
  PlannedProduction,
  ActualProduction,
  ProductionToleranceBuilder,
} from '@softwarearchetypes/planvsexecution';
import { Quantity, Unit } from '@softwarearchetypes/quantity';

const planned = [
  new PlannedProduction("January", Quantity.of(1000, Unit.of("pcs"))),
  new PlannedProduction("February", Quantity.of(1200, Unit.of("pcs"))),
];

const actual = [
  new ActualProduction("January", Quantity.of(980, Unit.of("pcs"))),
  new ActualProduction("February", Quantity.of(1350, Unit.of("pcs"))),
];

const tolerance = new ProductionToleranceBuilder().withPercentage(5).build();
const facade = new ProductionAnalysisFacade(tolerance);
const delta = facade.analyze(planned, actual);
// January: within tolerance (-2%), February: over plan (+12.5%)
```

### Repayment schedule analysis

```typescript
import {
  ScheduleAnalysisFacade,
  Payment,
  PaymentProcessed,
  PaymentSchedule,
  LatePaymentCondition,
} from '@softwarearchetypes/planvsexecution';

const schedule = new PaymentSchedule([
  new Payment("2024-01", 500),
  new Payment("2024-02", 500),
  new Payment("2024-03", 500),
]);

const actuals = [
  new PaymentProcessed("2024-01", 500, "2024-01-28"),  // on time
  new PaymentProcessed("2024-02", 500, "2024-03-05"),  // late
  new PaymentProcessed("2024-03", 750, "2024-03-20"),  // prepayment
];

const facade = new ScheduleAnalysisFacade(new LatePaymentCondition());
const result = facade.analyze(schedule, actuals);
// Identifies: one late payment in February, one prepayment in March
```

### Adaptive plan modification

```typescript
import {
  PlanModificationOrchestrator,
  ConfigurableProductionPlan,
  UnderProductionCondition,
  IncreaseBufferModifier,
} from '@softwarearchetypes/planvsexecution';

const plan = new ConfigurableProductionPlan([
  new PlannedProduction("Q1", Quantity.of(3000, Unit.of("units"))),
  new PlannedProduction("Q2", Quantity.of(3000, Unit.of("units"))),
]);

const orchestrator = new PlanModificationOrchestrator(
  new UnderProductionCondition(0.9),   // trigger if actual < 90% of plan
  new IncreaseBufferModifier(0.1),     // add 10% buffer to next period
);

orchestrator.apply(plan, deltaResults);
// Q2 target automatically raised to 3300 units to compensate for Q1 shortfall
```

## Real-world usage examples

### Manufacturing production tracking (Toyota Production System)

Daily planned vs actual output on an assembly line. The Toyota Production System relies on takt time and shift targets; any deviation triggers immediate corrective action (andon). Use `UnderProductionCondition` with `IncreaseBufferModifier` to carry forward shortfalls automatically.

```typescript
import {
  ProductionAnalysisFacade,
  PlannedProduction,
  ActualProduction,
  PlanModificationOrchestrator,
  ConfigurableProductionPlan,
  UnderProductionCondition,
  IncreaseBufferModifier,
  ProductionToleranceBuilder,
} from '@softwarearchetypes/planvsexecution';
import { Quantity, Unit } from '@softwarearchetypes/quantity';

const shiftUnit = Unit.of("vehicles");
const dailyPlan = new ConfigurableProductionPlan([
  new PlannedProduction("shift-2024-11-04-AM", Quantity.of(240, shiftUnit)),
  new PlannedProduction("shift-2024-11-04-PM", Quantity.of(240, shiftUnit)),
  new PlannedProduction("shift-2024-11-05-AM", Quantity.of(240, shiftUnit)),
]);

const shiftActuals = [
  new ActualProduction("shift-2024-11-04-AM", Quantity.of(235, shiftUnit)),
  new ActualProduction("shift-2024-11-04-PM", Quantity.of(198, shiftUnit)), // line stoppage
  new ActualProduction("shift-2024-11-05-AM", Quantity.of(241, shiftUnit)),
];

// 2% tolerance — within normal variation; anything beyond is flagged
const tolerance = new ProductionToleranceBuilder().withPercentage(2).build();
const facade = new ProductionAnalysisFacade(tolerance);
const delta = facade.analyze(dailyPlan.entries(), shiftActuals);

// Auto-compensate: if a shift underproduces, raise the next shift's target
const orchestrator = new PlanModificationOrchestrator(
  new UnderProductionCondition(0.98),
  new IncreaseBufferModifier(0.05),
);
orchestrator.apply(dailyPlan, delta);
// shift-2024-11-05-AM target was already raised to 252 before the shift started
```

### Loan repayment monitoring (bank installment tracking)

Banks need to detect late payments, partial payments, and prepayments against an amortisation schedule. Use `LatePaymentCondition` to trigger penalty interest logic and `SpreadRemainingAmountModifier` to rebalance outstanding installments after a partial payment.

```typescript
import {
  ScheduleAnalysisFacade,
  Payment,
  PaymentProcessed,
  ConfigurablePaymentSchedule,
  LatePaymentCondition,
  OnTimePaymentCondition,
  RemoveInstallmentModifier,
  SpreadRemainingAmountModifier,
  PlanModificationOrchestrator,
} from '@softwarearchetypes/planvsexecution';

const mortgageSchedule = new ConfigurablePaymentSchedule([
  new Payment("2024-01", 1_200),
  new Payment("2024-02", 1_200),
  new Payment("2024-03", 1_200),
  new Payment("2024-04", 1_200),
]);

const customerPayments = [
  new PaymentProcessed("2024-01", 1_200, "2024-01-15"),  // on time
  new PaymentProcessed("2024-02",   600, "2024-02-20"),  // partial — 50%
  new PaymentProcessed("2024-03", 2_400, "2024-03-10"),  // covers arrears + current
  new PaymentProcessed("2024-04", 1_200, "2024-04-14"),  // on time
];

const facade = new ScheduleAnalysisFacade(new LatePaymentCondition());
const result = facade.analyze(mortgageSchedule, customerPayments);

// After the partial payment in Feb, spread the shortfall across remaining months
const orchestrator = new PlanModificationOrchestrator(
  new LatePaymentCondition(),
  new SpreadRemainingAmountModifier(),
);
orchestrator.apply(mortgageSchedule, result);
// March installment revised upward to cover the February shortfall
```

### Sprint velocity tracking (Agile project management)

Compare story-point commitments at sprint planning against delivered points at review. Persistent velocity gaps inform future sprint capacity planning.

```typescript
import {
  ProductionAnalysisFacade,
  PlannedProduction,
  ActualProduction,
  ProductionToleranceBuilder,
} from '@softwarearchetypes/planvsexecution';
import { Quantity, Unit } from '@softwarearchetypes/quantity';

const sp = Unit.of("story_points");

const sprintCommitments = [
  new PlannedProduction("sprint-42", Quantity.of(34, sp)),
  new PlannedProduction("sprint-43", Quantity.of(34, sp)),
  new PlannedProduction("sprint-44", Quantity.of(34, sp)),
];

const sprintDeliveries = [
  new ActualProduction("sprint-42", Quantity.of(34, sp)),
  new ActualProduction("sprint-43", Quantity.of(21, sp)), // mid-sprint scope change
  new ActualProduction("sprint-44", Quantity.of(40, sp)), // team outperformed
];

// ±15% is acceptable natural variation for software teams
const tolerance = new ProductionToleranceBuilder().withPercentage(15).build();
const facade = new ProductionAnalysisFacade(tolerance);
const velocityDelta = facade.analyze(sprintCommitments, sprintDeliveries);
// sprint-43 flagged: delivered only 62% of commitment (outside tolerance)
// sprint-44 acceptable: +18% but teams rarely penalised for over-delivery
```

### SLA compliance monitoring (cloud provider uptime)

Cloud providers commit to 99.9% monthly uptime. Track planned availability minutes against actual downtime incidents to determine SLA breach and credit obligations.

```typescript
import {
  ProductionAnalysisFacade,
  PlannedProduction,
  ActualProduction,
  ProductionToleranceBuilder,
} from '@softwarearchetypes/planvsexecution';
import { Quantity, Unit } from '@softwarearchetypes/quantity';

const availableMinutes = Unit.of("minutes");
// 30-day month = 43 200 minutes; 99.9% SLA allows max 43.2 min downtime
const slaTarget = 43_200 * 0.999; // ≈ 43 157

const slaCommitments = [
  new PlannedProduction("2024-10", Quantity.of(slaTarget, availableMinutes)),
  new PlannedProduction("2024-11", Quantity.of(slaTarget, availableMinutes)),
];

const measuredUptime = [
  new ActualProduction("2024-10", Quantity.of(43_150, availableMinutes)), // compliant
  new ActualProduction("2024-11", Quantity.of(42_900, availableMinutes)), // breach — 300 min down
];

// Zero tolerance for SLA purposes — any shortfall is a breach
const tolerance = new ProductionToleranceBuilder().withPercentage(0).build();
const facade = new ProductionAnalysisFacade(tolerance);
const slaResult = facade.analyze(slaCommitments, measuredUptime);
// November flagged: 257-minute deficit triggers credit calculation
```

### Marketing campaign performance (ad spend and conversion tracking)

Compare planned ad spend budgets and conversion targets against actuals across channels. Overspend on a low-converting channel should trigger reallocation of remaining budget.

```typescript
import {
  ProductionAnalysisFacade,
  PlannedProduction,
  ActualProduction,
  ProductionToleranceBuilder,
} from '@softwarearchetypes/planvsexecution';
import { Quantity, Unit } from '@softwarearchetypes/quantity';

const usd = Unit.of("USD");
const conversions = Unit.of("conversions");

// Budget plan per channel per month
const budgetPlan = [
  new PlannedProduction("search-2024-Q4",   Quantity.of(50_000, usd)),
  new PlannedProduction("social-2024-Q4",   Quantity.of(30_000, usd)),
  new PlannedProduction("display-2024-Q4",  Quantity.of(20_000, usd)),
];

const actualSpend = [
  new ActualProduction("search-2024-Q4",   Quantity.of(48_500, usd)),  // underspent
  new ActualProduction("social-2024-Q4",   Quantity.of(34_200, usd)),  // overspent
  new ActualProduction("display-2024-Q4",  Quantity.of(19_100, usd)),  // within range
];

// ±5% budget variance is acceptable before finance escalation
const budgetTolerance = new ProductionToleranceBuilder().withPercentage(5).build();
const budgetFacade = new ProductionAnalysisFacade(budgetTolerance);
const budgetDelta = budgetFacade.analyze(budgetPlan, actualSpend);
// social-2024-Q4 flagged: 14% overspend exceeds 5% tolerance

// Separate facade for conversion targets
const conversionPlan = [
  new PlannedProduction("search-2024-Q4",   Quantity.of(2_000, conversions)),
  new PlannedProduction("social-2024-Q4",   Quantity.of(1_500, conversions)),
  new PlannedProduction("display-2024-Q4",  Quantity.of(400,   conversions)),
];

const actualConversions = [
  new ActualProduction("search-2024-Q4",   Quantity.of(2_210, conversions)), // over target
  new ActualProduction("social-2024-Q4",   Quantity.of(1_100, conversions)), // under target
  new ActualProduction("display-2024-Q4",  Quantity.of(390,   conversions)), // within range
];

const conversionTolerance = new ProductionToleranceBuilder().withPercentage(10).build();
const conversionFacade = new ProductionAnalysisFacade(conversionTolerance);
const conversionDelta = conversionFacade.analyze(conversionPlan, actualConversions);
// social-2024-Q4 flagged: 27% under conversion despite 14% overspend
```

### Construction project milestones (planned vs actual completion and cost)

Track milestone completion dates and costs against the baseline project schedule. A delay in a critical-path milestone cascades into downstream dependencies.

```typescript
import {
  ScheduleAnalysisFacade,
  Payment,
  PaymentProcessed,
  PaymentSchedule,
  LatePaymentCondition,
} from '@softwarearchetypes/planvsexecution';

// Model milestone cost drawdowns as a payment schedule
// Each "payment" represents a planned cost release tied to a milestone date
const baselineSchedule = new PaymentSchedule([
  new Payment("2024-03-foundation-complete",   120_000),
  new Payment("2024-06-frame-complete",        280_000),
  new Payment("2024-09-envelope-complete",     350_000),
  new Payment("2024-12-fit-out-complete",      450_000),
]);

// Actual milestone completions — dates show when sign-off was received
const actualMilestones = [
  new PaymentProcessed("2024-03-foundation-complete", 125_000, "2024-03-28"), // on time, 4% over cost
  new PaymentProcessed("2024-06-frame-complete",      295_000, "2024-07-15"), // 6 weeks late, 5% over
  new PaymentProcessed("2024-09-envelope-complete",   340_000, "2024-10-20"), // 7 weeks late, 3% under
  new PaymentProcessed("2024-12-fit-out-complete",    510_000, "2025-02-10"), // 10 weeks late, 13% over
];

const facade = new ScheduleAnalysisFacade(new LatePaymentCondition());
const projectDelta = facade.analyze(baselineSchedule, actualMilestones);
// Reveals: cumulative delay of 10 weeks and £60k cost overrun by project end
// Late flags on milestones 2–4 trigger contract penalty clause review
```
