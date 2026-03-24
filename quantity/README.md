# @softwarearchetypes/quantity

## What is this archetype?

The quantity archetype models measurable amounts with their units of measurement. It provides a Quantity class that pairs a numeric amount with a Unit, ensuring unit-safe arithmetic. It also includes Money (multi-currency value object with rounding) and Percentage as specialized quantity types commonly needed in business domains.

## When to use this archetype

- You are modeling quantities with units (weight, length, volume, count, time)
- You need a Money value object with currency codes and safe arithmetic (add, subtract, multiply, percentage)
- You need to represent percentages as first-class values
- You want to prevent adding/comparing quantities with incompatible units
- You are building pricing, inventory, accounting, or any domain that deals with measured amounts

## Key concepts

- **Quantity** - Immutable value object pairing an amount with a Unit; supports add, subtract, compareTo with unit compatibility checks
- **Unit** - Represents a unit of measurement (e.g., pieces, kilograms, hours)
- **Money** - Immutable currency-aware value object with arithmetic (add, subtract, multiply, percentage), auto-rounding to 2 decimal places, and factory methods for common currencies (USD, EUR, GBP, PLN)
- **Percentage** - Value object representing a percentage, usable with Money for calculations

## Installation

```bash
npm install @softwarearchetypes/quantity
```

## Dependencies

- `@softwarearchetypes/common`

## Quick example

```typescript
import { Quantity, Unit, Money, Percentage } from '@softwarearchetypes/quantity';

// Quantity with units
const weight = Quantity.of(5, Unit.of("kg"));
const moreWeight = Quantity.of(3, Unit.of("kg"));
const total = weight.add(moreWeight); // 8 kg

// Money
const price = Money.usd(29.99);
const discounted = price.subtract(Money.usd(5));

// Percentage
const taxRate = Percentage.of(23);
```
