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

Clone the repository and install locally:

```bash
git clone <repo-url> archetypes-typescript
cd archetypes-typescript
npm install
```

Then link the archetype into your project:

```bash
npm install ../archetypes-typescript/pricing
```

## Dependencies

- `@softwarearchetypes/quantity`

## Quick example

```typescript
import {
  SimpleFixedCalculator,
  StepFunctionCalculator,
  CompositeFunctionCalculator,
  Interpretation,
  StepBoundary,
  Parameters,
  UnitToTotalAdapter,
} from '@softwarearchetypes/pricing';
import { Money } from '@softwarearchetypes/quantity';

// Fixed price
const baseFee = new SimpleFixedCalculator("Base Fee", Money.usd(10));

// Step function (tiered pricing): unit price drops as volume increases
const tiered = new StepFunctionCalculator("Volume Rate", [
  { boundary: StepBoundary.inclusive(0),    price: Money.usd(5) },
  { boundary: StepBoundary.inclusive(100),  price: Money.usd(3) },
  { boundary: StepBoundary.inclusive(1000), price: Money.usd(1) },
], Interpretation.UNIT);

// Convert unit price to a total price for a quantity of 250
const unitPrice = tiered.calculate(Parameters.of(250));  // Money.usd(3) — $3/unit in the 100–999 tier
const totalCalc = new UnitToTotalAdapter(tiered);
const totalPrice = totalCalc.calculate(Parameters.of(250)); // Money.usd(750) — 250 × $3

// Composite: base fee + volume charge
const composite = new CompositeFunctionCalculator("Order Total", [baseFee, totalCalc]);
const orderTotal = composite.calculate(Parameters.of(250)); // Money.usd(760) — $10 + $750
```

## Real-world usage examples

### AWS-style tiered cloud compute pricing

Charge per CPU-hour with decreasing unit rates as usage grows, matching the graduated pricing model used by cloud providers for on-demand compute.

```typescript
import {
  StepFunctionCalculator,
  UnitToTotalAdapter,
  Interpretation,
  StepBoundary,
  Parameters,
} from '@softwarearchetypes/pricing';
import { Money } from '@softwarearchetypes/quantity';

// On-demand compute: price per CPU-hour, tiered by monthly consumption
const computeUnitRate = new StepFunctionCalculator("EC2 On-Demand Rate", [
  { boundary: StepBoundary.inclusive(0),     price: Money.usd(0.096) }, // first 100 hours
  { boundary: StepBoundary.inclusive(100),   price: Money.usd(0.075) }, // 100–999 hours
  { boundary: StepBoundary.inclusive(1000),  price: Money.usd(0.050) }, // 1 000–9 999 hours
  { boundary: StepBoundary.inclusive(10000), price: Money.usd(0.030) }, // 10 000+ hours
], Interpretation.UNIT);

const totalComputeCalc = new UnitToTotalAdapter(computeUnitRate);

// A customer who consumed 450 CPU-hours this month
const bill = totalComputeCalc.calculate(Parameters.of(450));
// unit rate = $0.075  →  total = $33.75
```

### Electricity utility billing with progressive tariffs

Many utility regulators require progressive (step) tariffs: residential customers pay a low "lifeline" rate for essential consumption and a higher rate for additional usage, discouraging waste while protecting low-income households.

```typescript
import {
  StepFunctionCalculator,
  SimpleFixedCalculator,
  CompositeFunctionCalculator,
  UnitToTotalAdapter,
  Interpretation,
  StepBoundary,
  Parameters,
} from '@softwarearchetypes/pricing';
import { Money } from '@softwarearchetypes/quantity';

// Tariff tiers in $/kWh
const energyRate = new StepFunctionCalculator("Energy Tariff", [
  { boundary: StepBoundary.inclusive(0),   price: Money.of(0.12, "EUR") }, // 0–200 kWh lifeline rate
  { boundary: StepBoundary.inclusive(200), price: Money.of(0.22, "EUR") }, // 201–600 kWh standard rate
  { boundary: StepBoundary.inclusive(600), price: Money.of(0.35, "EUR") }, // 601+ kWh peak/excess rate
], Interpretation.UNIT);

const energyCharge  = new UnitToTotalAdapter(energyRate);
const networkCharge = new SimpleFixedCalculator("Network Access Fee", Money.of(8.50, "EUR"));
const vatCharge     = new SimpleFixedCalculator("VAT (21%)", Money.of(0, "EUR")); // placeholder — extend with a percentage calculator

const monthlyBill = new CompositeFunctionCalculator("Monthly Electricity Bill", [
  energyCharge,
  networkCharge,
]);

// A household that consumed 380 kWh
const total = monthlyBill.calculate(Parameters.of(380));
// energy: 380 × €0.22 = €83.60  +  network: €8.50  =  €92.10
```

### SaaS subscription tiers (Slack / GitHub-style seat pricing)

Flat per-seat pricing with a free tier, modelling the structure used by tools like Slack (free up to N users, then per-seat) or GitHub (free for public repos, flat rate per developer seat on paid plans).

```typescript
import {
  DiscretePointsCalculator,
  SimpleFixedCalculator,
  CompositeFunctionCalculator,
  UnitToTotalAdapter,
  Interpretation,
  Parameters,
} from '@softwarearchetypes/pricing';
import { Money } from '@softwarearchetypes/quantity';

// Per-seat monthly rate looked up from a discrete price list
const seatRateTable = new DiscretePointsCalculator("Seat Rate", [
  { point: 0,  price: Money.usd(0.00) },  // Free plan
  { point: 1,  price: Money.usd(8.75) },  // Pro plan
  { point: 2,  price: Money.usd(7.25) },  // Business plan (bulk discount)
  { point: 3,  price: Money.usd(5.50) },  // Enterprise plan
], Interpretation.UNIT);

// planTier is passed as the quantity (0=Free, 1=Pro, 2=Business, 3=Enterprise)
const perSeatCharge = new UnitToTotalAdapter(seatRateTable);

// 40 seats on the Business plan (tier 2)
const params = Parameters.of(2).withContext({ seats: 40 });
const monthlyBill = perSeatCharge.calculate(params);
// $7.25 × 40 = $290.00/month
```

### Ride-hailing surge pricing (Uber-style)

A composite fare built from a base flag-fall, a per-kilometre distance charge, a per-minute time charge, and a real-time surge multiplier applied to the variable components.

```typescript
import {
  SimpleFixedCalculator,
  SimpleInterestCalculator,
  CompositeFunctionCalculator,
  Interpretation,
  Parameters,
} from '@softwarearchetypes/pricing';
import { Money } from '@softwarearchetypes/quantity';

// Base components
const flagFall       = new SimpleFixedCalculator("Base Fare",        Money.usd(2.50));
const distanceRate   = new SimpleInterestCalculator("Distance Charge", 1.20); // $1.20/km
const timeRate       = new SimpleInterestCalculator("Time Charge",     0.25); // $0.25/min

// Surge wraps variable components with a 1.8× multiplier at peak demand.
// In a real implementation you would extend Calculator to apply the multiplier
// from Parameters; here we show the structural composition.
const surgeMultiplier = 1.8;
const surgedDistance  = new SimpleInterestCalculator("Surged Distance", 1.20 * surgeMultiplier);
const surgedTime      = new SimpleInterestCalculator("Surged Time",     0.25 * surgeMultiplier);

const fare = new CompositeFunctionCalculator("Ride Fare (surge)", [
  flagFall,
  surgedDistance,
  surgedTime,
]);

// A 6 km, 14-minute trip during surge
const distanceParams = Parameters.of(6);
const timeParams     = Parameters.of(14);
// In a full implementation Parameters carries both dimensions;
// the composite dispatches each sub-calculator with the relevant context.
```

### Insurance premium calculation with composite components

An annual motor insurance premium built from actuarially distinct components — each modelled as a versioned pricing component — then combined into a single composite.

```typescript
import {
  SimpleFixedCalculator,
  StepFunctionCalculator,
  CompositeFunctionCalculator,
  SimpleComponent,
  CompositeComponent,
  ComponentVersion,
  Interpretation,
  StepBoundary,
  Parameters,
  PricingFacade,
} from '@softwarearchetypes/pricing';
import { Money } from '@softwarearchetypes/quantity';

const facade = new PricingFacade();

// Base premium by vehicle age band
const basePremiumCalc = new StepFunctionCalculator("Base Premium", [
  { boundary: StepBoundary.inclusive(0),  price: Money.usd(300) }, // 0–2 years old
  { boundary: StepBoundary.inclusive(3),  price: Money.usd(250) }, // 3–7 years old
  { boundary: StepBoundary.inclusive(8),  price: Money.usd(190) }, // 8+ years old
], Interpretation.UNIT);

// Fixed loadings
const theftLoading        = new SimpleFixedCalculator("Theft Loading",         Money.usd(45));
const personalInjuryLoading = new SimpleFixedCalculator("PI Loading",          Money.usd(80));
const adminFee            = new SimpleFixedCalculator("Policy Admin Fee",       Money.usd(25));

// Composite annual premium
const annualPremium = new CompositeFunctionCalculator("Annual Motor Premium", [
  basePremiumCalc,
  theftLoading,
  personalInjuryLoading,
  adminFee,
]);

// Vehicle that is 5 years old
const quote = annualPremium.calculate(Parameters.of(5));
// base: $250  +  theft: $45  +  PI: $80  +  admin: $25  =  $400
```

### Telecom data plan pricing with volume tiers

A mobile data tariff where the first gigabytes are included in the plan fee, subsequent gigabytes are charged at a stepped overage rate, and international roaming is a discrete add-on looked up from a point table.

```typescript
import {
  SimpleFixedCalculator,
  StepFunctionCalculator,
  DiscretePointsCalculator,
  CompositeFunctionCalculator,
  UnitToTotalAdapter,
  Interpretation,
  StepBoundary,
  Parameters,
} from '@softwarearchetypes/pricing';
import { Money } from '@softwarearchetypes/quantity';

// Monthly plan fee (includes 10 GB)
const planFee = new SimpleFixedCalculator("Monthly Plan Fee", Money.usd(35.00));

// Overage rate per GB beyond the included allowance
const overageRate = new StepFunctionCalculator("Data Overage Rate", [
  { boundary: StepBoundary.inclusive(0),  price: Money.usd(5.00) }, // first 5 overage GB
  { boundary: StepBoundary.inclusive(5),  price: Money.usd(3.50) }, // next 15 overage GB
  { boundary: StepBoundary.inclusive(20), price: Money.usd(2.00) }, // 20+ overage GB (throttle alternative)
], Interpretation.UNIT);

const overageCharge = new UnitToTotalAdapter(overageRate);

// Roaming day-pass: discrete price per destination zone (0=domestic, 1=Canada/Mexico, 2=Europe, 3=Rest of World)
const roamingDayPass = new DiscretePointsCalculator("Roaming Day Pass", [
  { point: 0, price: Money.usd(0.00)  },
  { point: 1, price: Money.usd(5.00)  },
  { point: 2, price: Money.usd(10.00) },
  { point: 3, price: Money.usd(15.00) },
], Interpretation.UNIT);

// Customer used 18 GB (8 GB over the 10 GB allowance) with 3 roaming days in Europe (zone 2)
const overageBill  = overageCharge.calculate(Parameters.of(8));  // 8 × $5.00 = $40.00
const roamingBill  = roamingDayPass.calculate(Parameters.of(2)); // $10.00/day × 3 days handled externally

// Full monthly bill
const monthlyBill = new CompositeFunctionCalculator("Monthly Mobile Bill", [
  planFee,
  overageCharge,
]);
const total = monthlyBill.calculate(Parameters.of(8));
// $35.00  +  $40.00  =  $75.00  (plus roaming calculated separately)
```
