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

```bash
npm install @softwarearchetypes/rules
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
