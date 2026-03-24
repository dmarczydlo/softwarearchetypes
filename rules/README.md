# @softwarearchetypes/rules

## What is this archetype?

The rules archetype provides two powerful business rule systems. The **discounting** module implements offer item modifiers using chain-of-responsibility and visitor patterns -- supporting percentage discounts, fixed price overrides, margin guardians, and configurable predicate-based rules with client context awareness. The **scoring** module provides an algebraic expression engine with AST-based rule evaluation, supporting numeric scores, fuzzy logic, and explainable (contribution-tracking) scoring.

## When to use this archetype

- You need flexible discount/promotion rules (percentage off, fixed price, accumulated discounts)
- You want chain-of-responsibility discount pipelines with guardian limits (e.g., margin protection)
- You need predicate-based rules: apply discount only if quantity > 10, or item is in category X
- You are building a loyalty/client status system with discount tiers based on spending, tenure, or status
- You need a scoring/rating engine with algebraic expressions (sum, if-then-else, comparisons)
- You want explainable scores that track which rules contributed to the final score
- You need fuzzy logic evaluation for soft matching or risk assessment
- You are building recommendation engines, credit scoring, or gamification point systems

## Key concepts

### Discounting
- **OfferItem** - An item in an offer with base price, current price, and modification history
- **OfferItemModifier** - Transforms an offer item's price (visitor pattern)
- **ChainOfferItemModifier** - Chains multiple modifiers sequentially
- **PercentageOfferItemModifier** - Applies percentage discount
- **ConfigurableItemModifier** - Combines predicate (when to apply) + applier (how to modify) + guardian (limits)
- **MarginGuardian** - Prevents discounts below a minimum margin
- **ClientContext / ClientStatus** - Client-specific context for personalized pricing rules
- **ConfigProvider / DiscountRepository** - Configuration for dynamic discount rules
- **ReflectionBeanReader / ReflectionBeanWriter** - Serializable rule configuration

### Scoring
- **Expression** - AST nodes: AndExpression, OrExpression, NotExpression, MetricCmpExpression, SumExpression, IfThenElseExpression, ConstScoreExpression, LabeledExpression
- **Algebra** - Evaluates expressions: ScoreAlgebra (numeric), FuzzyAlgebra (fuzzy logic), ExplainableAlgebra (with contributions)
- **Score** - A numeric score result
- **FuzzyValue** - A value between 0 and 1 for fuzzy logic
- **ExplainedScore / Contribution** - Score with explanation of how each rule contributed
- **EventRuleEngine** - Evaluates rules against customer events within time windows
- **Metric / CmpOp** - Metrics and comparison operators for rule conditions

## Installation

Clone the repository and install locally:

```bash
git clone <repo-url> archetypes-typescript
cd archetypes-typescript
npm install
```

Then link the archetype into your project:

```bash
npm install ../archetypes-typescript/rules
```

## Dependencies

- `@softwarearchetypes/quantity`

## Quick example

```typescript
import { OfferItem, PercentageOfferItemModifier, ChainOfferItemModifier } from '@softwarearchetypes/rules';
import { Money } from '@softwarearchetypes/quantity';

// Discount chain
const item = new OfferItem("PROD-1", Money.usd(100), 1);
const discount = new ChainOfferItemModifier([
  new PercentageOfferItemModifier("Summer Sale", 10),  // 10% off
  new PercentageOfferItemModifier("Loyalty Bonus", 5), // additional 5% off
]);
const discounted = discount.apply(item);

// Scoring with expressions
import { ConstScoreExpression, SumExpression, ScoreAlgebra } from '@softwarearchetypes/rules';

const expr = new SumExpression([
  new ConstScoreExpression(10),
  new ConstScoreExpression(5),
]);
const algebra = new ScoreAlgebra();
const score = expr.accept(algebra); // 15
```

### Predicate-based discount with margin protection

Apply a discount only when a condition is met and guard against selling below cost:

```typescript
import {
  OfferItem,
  ConfigurableItemModifier,
  MarginGuardian,
  PercentageOfferItemModifier,
} from '@softwarearchetypes/rules';
import { Money } from '@softwarearchetypes/quantity';

// Only apply 20% discount when quantity >= 10, and never below 15% margin
const bulkModifier = new ConfigurableItemModifier(
  (item, ctx) => item.quantity >= 10,                   // predicate
  new PercentageOfferItemModifier("Bulk Discount", 20), // applier
  new MarginGuardian(0.15),                             // guardian: min 15% margin
);

const item = new OfferItem("WIDGET-9", Money.usd(50), 12);
const result = bulkModifier.apply(item);
```

### Explainable scoring

Use `ExplainableAlgebra` to see exactly which rules contributed to the final score:

```typescript
import {
  LabeledExpression,
  SumExpression,
  ConstScoreExpression,
  ExplainableAlgebra,
} from '@softwarearchetypes/rules';

const expr = new SumExpression([
  new LabeledExpression("base_score",    new ConstScoreExpression(50)),
  new LabeledExpression("tenure_bonus",  new ConstScoreExpression(20)),
  new LabeledExpression("activity_bonus",new ConstScoreExpression(15)),
]);

const algebra = new ExplainableAlgebra();
const result  = expr.accept(algebra);
// result.score         => 85
// result.contributions => [{ label: "base_score", value: 50 }, ...]
```

### Fuzzy logic scoring

Evaluate soft/partial conditions with `FuzzyAlgebra`:

```typescript
import {
  MetricCmpExpression,
  FuzzyAlgebra,
  Metric,
  CmpOp,
} from '@softwarearchetypes/rules';

// "How much does the customer's credit utilisation exceed 30%?"
const highUtilisation = new MetricCmpExpression(
  Metric.CREDIT_UTILISATION,
  CmpOp.GT,
  0.30,
);

const algebra = new FuzzyAlgebra({ [Metric.CREDIT_UTILISATION]: 0.55 });
const fuzzy   = highUtilisation.accept(algebra);
// fuzzy.value is between 0 and 1, not a hard true/false
```

## Real-world usage examples

### E-commerce promotion engine (Black Friday stacked discounts with margin protection)

Black Friday campaigns commonly stack a site-wide percentage discount on top of a
category-specific deal. A `MarginGuardian` ensures the business never ships below cost
regardless of how many promotions are composed.

```typescript
import {
  OfferItem,
  ChainOfferItemModifier,
  ConfigurableItemModifier,
  MarginGuardian,
  PercentageOfferItemModifier,
  ClientContext,
  ClientStatus,
} from '@softwarearchetypes/rules';
import { Money } from '@softwarearchetypes/quantity';

const blackFridayChain = new ChainOfferItemModifier([
  // 15% site-wide flash sale
  new PercentageOfferItemModifier("Black Friday Flash", 15),

  // Extra 10% only for electronics category
  new ConfigurableItemModifier(
    (item) => item.category === "electronics",
    new PercentageOfferItemModifier("Electronics Deal", 10),
    new MarginGuardian(0.10), // floor: 10% margin
  ),

  // Extra 5% for Gold/Platinum loyalty members
  new ConfigurableItemModifier(
    (_item, ctx) =>
      ctx?.clientStatus === ClientStatus.GOLD ||
      ctx?.clientStatus === ClientStatus.PLATINUM,
    new PercentageOfferItemModifier("Loyalty VIP", 5),
    new MarginGuardian(0.10),
  ),
]);

const laptop = new OfferItem("LAPTOP-X1", Money.usd(1200), 1, "electronics");
const ctx    = new ClientContext(ClientStatus.GOLD);
const priced = blackFridayChain.apply(laptop, ctx);
// Stacked discounts applied in order; margin guardian stops the chain if needed
```

### Loyalty program tiers (airline miles / Starbucks-style status-based discounts)

Different tiers unlock progressively larger benefits. A `ConfigurableItemModifier` per
tier keeps each rule isolated and independently testable.

```typescript
import {
  OfferItem,
  ChainOfferItemModifier,
  ConfigurableItemModifier,
  PercentageOfferItemModifier,
  ClientContext,
  ClientStatus,
} from '@softwarearchetypes/rules';
import { Money } from '@softwarearchetypes/quantity';

const tierModifiers = new ChainOfferItemModifier([
  new ConfigurableItemModifier(
    (_item, ctx) => ctx?.clientStatus === ClientStatus.SILVER,
    new PercentageOfferItemModifier("Silver Member Discount", 5),
  ),
  new ConfigurableItemModifier(
    (_item, ctx) => ctx?.clientStatus === ClientStatus.GOLD,
    new PercentageOfferItemModifier("Gold Member Discount", 10),
  ),
  new ConfigurableItemModifier(
    (_item, ctx) => ctx?.clientStatus === ClientStatus.PLATINUM,
    new PercentageOfferItemModifier("Platinum Member Discount", 15),
  ),
]);

const flight = new OfferItem("FLIGHT-LHR-JFK", Money.usd(800), 1);
const ctx    = new ClientContext(ClientStatus.PLATINUM);
const priced = tierModifiers.apply(flight, ctx);
// Platinum member receives 15% off
```

### Credit scoring engine (FICO-style weighted factors with explainable scores)

A weighted sum of labelled sub-expressions produces an explainable score. Underwriters
can inspect which factor drove an approval or rejection.

```typescript
import {
  LabeledExpression,
  SumExpression,
  IfThenElseExpression,
  MetricCmpExpression,
  ConstScoreExpression,
  ExplainableAlgebra,
  Metric,
  CmpOp,
} from '@softwarearchetypes/rules';

// Each labelled branch maps to a FICO-style factor
const ficoExpr = new SumExpression([
  new LabeledExpression(
    "payment_history",      // 35% weight
    new IfThenElseExpression(
      new MetricCmpExpression(Metric.MISSED_PAYMENTS, CmpOp.EQ, 0),
      new ConstScoreExpression(350),
      new ConstScoreExpression(0),
    ),
  ),
  new LabeledExpression(
    "credit_utilisation",   // 30% weight
    new IfThenElseExpression(
      new MetricCmpExpression(Metric.CREDIT_UTILISATION, CmpOp.LT, 0.30),
      new ConstScoreExpression(300),
      new ConstScoreExpression(100),
    ),
  ),
  new LabeledExpression(
    "credit_age_years",     // 15% weight
    new IfThenElseExpression(
      new MetricCmpExpression(Metric.CREDIT_AGE_YEARS, CmpOp.GTE, 7),
      new ConstScoreExpression(150),
      new ConstScoreExpression(50),
    ),
  ),
  new LabeledExpression(
    "account_mix",          // 10% weight
    new ConstScoreExpression(100),
  ),
  new LabeledExpression(
    "new_inquiries",        // 10% weight
    new IfThenElseExpression(
      new MetricCmpExpression(Metric.HARD_INQUIRIES_6M, CmpOp.LTE, 1),
      new ConstScoreExpression(100),
      new ConstScoreExpression(20),
    ),
  ),
]);

const metrics = {
  [Metric.MISSED_PAYMENTS]:     0,
  [Metric.CREDIT_UTILISATION]:  0.22,
  [Metric.CREDIT_AGE_YEARS]:    9,
  [Metric.HARD_INQUIRIES_6M]:   1,
};

const algebra = new ExplainableAlgebra(metrics);
const result  = ficoExpr.accept(algebra);
// result.score => 1000  (perfect score on these inputs)
// result.contributions lists each factor's contribution for audit trail
```

### Insurance risk assessment (fuzzy logic for risk factors)

Hard thresholds create cliff-edge pricing anomalies. Fuzzy logic smooths the transition
between risk bands, producing fairer premiums and fewer edge cases.

```typescript
import {
  SumExpression,
  LabeledExpression,
  MetricCmpExpression,
  FuzzyAlgebra,
  Metric,
  CmpOp,
} from '@softwarearchetypes/rules';

// Each expression returns a value in [0, 1]; higher means more risk
const riskExpr = new SumExpression([
  new LabeledExpression(
    "age_risk",
    new MetricCmpExpression(Metric.DRIVER_AGE, CmpOp.LT, 25),
  ),
  new LabeledExpression(
    "mileage_risk",
    new MetricCmpExpression(Metric.ANNUAL_MILEAGE, CmpOp.GT, 20000),
  ),
  new LabeledExpression(
    "claims_risk",
    new MetricCmpExpression(Metric.CLAIMS_LAST_3Y, CmpOp.GT, 1),
  ),
]);

const driverMetrics = {
  [Metric.DRIVER_AGE]:      22,
  [Metric.ANNUAL_MILEAGE]:  18000,
  [Metric.CLAIMS_LAST_3Y]:  0,
};

const fuzzyAlgebra = new FuzzyAlgebra(driverMetrics);
const riskScore    = riskExpr.accept(fuzzyAlgebra);
// riskScore.value is a continuous number; map it to a premium band
const premiumMultiplier = 1 + riskScore.value * 0.5; // e.g. up to 50% loading
```

### Gamification point system (Duolingo-style scoring with streaks and bonuses)

An `EventRuleEngine` evaluates rules against timestamped customer events, making it
easy to award points for streaks, first-time actions, or volume milestones.

```typescript
import {
  EventRuleEngine,
  SumExpression,
  LabeledExpression,
  IfThenElseExpression,
  MetricCmpExpression,
  ConstScoreExpression,
  ExplainableAlgebra,
  Metric,
  CmpOp,
} from '@softwarearchetypes/rules';

const pointsExpr = new SumExpression([
  // Base XP for completing a lesson
  new LabeledExpression("lesson_xp", new ConstScoreExpression(10)),

  // Streak bonus: +5 XP if the user has a streak >= 7 days
  new LabeledExpression(
    "streak_bonus",
    new IfThenElseExpression(
      new MetricCmpExpression(Metric.CURRENT_STREAK_DAYS, CmpOp.GTE, 7),
      new ConstScoreExpression(5),
      new ConstScoreExpression(0),
    ),
  ),

  // Perfect-lesson bonus: +3 XP for zero mistakes
  new LabeledExpression(
    "perfect_bonus",
    new IfThenElseExpression(
      new MetricCmpExpression(Metric.LESSON_MISTAKES, CmpOp.EQ, 0),
      new ConstScoreExpression(3),
      new ConstScoreExpression(0),
    ),
  ),
]);

const engine  = new EventRuleEngine(pointsExpr, new ExplainableAlgebra());
const metrics = {
  [Metric.CURRENT_STREAK_DAYS]: 10,
  [Metric.LESSON_MISTAKES]:     0,
};
const award = engine.evaluate(metrics);
// award.score => 18  (10 base + 5 streak + 3 perfect)
// award.contributions details each bonus for the XP breakdown UI
```

### Dynamic pricing rules (hotel revenue management - occupancy-based pricing adjustments)

Revenue management systems adjust rates in real time based on occupancy, lead time, and
demand signals. Chaining modifiers lets each signal make an independent, bounded
adjustment.

```typescript
import {
  OfferItem,
  ChainOfferItemModifier,
  ConfigurableItemModifier,
  PercentageOfferItemModifier,
  MarginGuardian,
} from '@softwarearchetypes/rules';
import { Money } from '@softwarearchetypes/quantity';

// Context carries real-time signals passed alongside the item
interface HotelContext {
  occupancyPct: number;  // 0-100
  daysToArrival: number;
  demandIndex: number;   // >1 means high demand
}

const revenueChain = new ChainOfferItemModifier([
  // Low occupancy: discount to stimulate demand
  new ConfigurableItemModifier(
    (_item, ctx: HotelContext) => ctx.occupancyPct < 40,
    new PercentageOfferItemModifier("Low Occupancy Discount", 15),
    new MarginGuardian(0.20),
  ),

  // Last-minute fill: deeper discount within 48 hours
  new ConfigurableItemModifier(
    (_item, ctx: HotelContext) =>
      ctx.occupancyPct < 60 && ctx.daysToArrival <= 2,
    new PercentageOfferItemModifier("Last Minute Deal", 10),
    new MarginGuardian(0.15),
  ),

  // High demand / event nights: apply a premium
  new ConfigurableItemModifier(
    (_item, ctx: HotelContext) =>
      ctx.occupancyPct > 85 || ctx.demandIndex > 1.5,
    new PercentageOfferItemModifier("Peak Demand Surcharge", -20), // negative = price up
  ),
]);

const room = new OfferItem("ROOM-DELUXE-101", Money.usd(200), 1);
const ctx: HotelContext = { occupancyPct: 35, daysToArrival: 10, demandIndex: 0.9 };
const priced = revenueChain.apply(room, ctx);
// Low occupancy rule fires; margin guardian prevents going below 20% margin
```
