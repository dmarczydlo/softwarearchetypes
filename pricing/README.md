# @softwarearchetypes/pricing

## What is this archetype?

The pricing archetype models price calculations as composable calculator objects. It supports fixed prices, interest-based calculations, step functions (tiered/graduated pricing), discrete point lookups, daily increments, and composite calculators that combine multiple pricing components. Each calculator has an interpretation (unit, total, or marginal price) with adapters for converting between them. Components can be versioned and constrained by applicability rules.

## When to use this archetype

- You need tiered/graduated pricing (step functions, volume discounts)
- You are building a rate card, tariff table, or pricing engine
- You need composite pricing that combines multiple calculation components (base price + fees + tax)
- You want to model unit price vs. total price vs. marginal price with automatic conversion
- You need versioned pricing components with validity periods
- You are building subscription pricing, utility billing, or insurance premium calculations
- You need applicability constraints (rules for when a price component applies)

## Key concepts

- **Calculator** - Interface: takes Parameters, returns Money. Implementations include SimpleFixedCalculator, SimpleInterestCalculator, StepFunctionCalculator, DiscretePointsCalculator, DailyIncrementCalculator, ContinuousLinearTimeCalculator
- **CompositeFunctionCalculator** - Combines multiple calculators into a single calculation
- **Interpretation** - Whether a calculator computes UNIT, TOTAL, or MARGINAL price
- **UnitToTotalAdapter / TotalToUnitAdapter / MarginalToTotalAdapter** etc. - Convert between price interpretations
- **StepBoundary** - Defines tier boundaries (inclusive/exclusive) for step function pricing
- **Component / SimpleComponent / CompositeComponent** - Named, versioned pricing building blocks
- **ComponentVersion** - A specific version of a pricing component with validity and applicability constraints
- **ApplicabilityConstraint** - Boolean rules (equals, inSet, greaterThan, between, and/or/not) that control when a component applies
- **PricingFacade** - High-level API for creating and managing calculators and components
- **PricingContext / Parameters** - Input context for price calculations

## Installation

```bash
npm install @softwarearchetypes/pricing
```

## Dependencies

- `@softwarearchetypes/quantity`

## Quick example

```typescript
import { SimpleFixedCalculator, StepFunctionCalculator, CompositeFunctionCalculator, Interpretation, StepBoundary, Parameters } from '@softwarearchetypes/pricing';
import { Money } from '@softwarearchetypes/quantity';

// Fixed price
const baseFee = new SimpleFixedCalculator("Base Fee", Money.usd(10));

// Step function (tiered pricing)
const tiered = new StepFunctionCalculator("Volume Rate", [
  { boundary: StepBoundary.inclusive(0), price: Money.usd(5) },
  { boundary: StepBoundary.inclusive(100), price: Money.usd(3) },
  { boundary: StepBoundary.inclusive(1000), price: Money.usd(1) },
], Interpretation.UNIT);

const price = tiered.calculate(Parameters.of(250)); // $3 per unit
```
