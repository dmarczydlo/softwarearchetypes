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

Clone the repository and install locally:

```bash
git clone <repo-url> archetypes-typescript
cd archetypes-typescript
npm install
```

Then link the archetype into your project:

```bash
npm install ../archetypes-typescript/quantity
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

// Apply a percentage to money
const tax = price.percentage(taxRate); // 23% of $29.99
const priceWithTax = price.add(tax);

// Unit compatibility check — adding incompatible units throws
const length = Quantity.of(10, Unit.of("m"));
// length.add(weight); // throws: incompatible units
```

## Real-world usage examples

### E-commerce cart totals with Money

Accumulate line item prices and apply a percentage discount to the cart total.

```typescript
import { Money, Percentage } from '@softwarearchetypes/quantity';

const lineItems = [
  Money.usd(19.99),
  Money.usd(49.95),
  Money.usd(8.50),
];

const subtotal = lineItems.reduce((acc, item) => acc.add(item), Money.usd(0));
// subtotal = $78.44

const loyaltyDiscount = Percentage.of(10);
const discountAmount = subtotal.percentage(loyaltyDiscount);
const cartTotal = subtotal.subtract(discountAmount);
// cartTotal = $70.60 (rounded to 2 decimal places)
```

### Currency handling for international pricing

Use per-currency factory methods to keep prices in their native currency. Arithmetic is only allowed between Money objects of the same currency.

```typescript
import { Money, Percentage } from '@softwarearchetypes/quantity';

const priceUSD = Money.usd(99.00);
const priceEUR = Money.eur(89.00);
const priceGBP = Money.gbp(79.00);
const pricePLN = Money.pln(399.00);

// Regional VAT rates
const vatDE  = Percentage.of(19);
const vatUK  = Percentage.of(20);
const vatPL  = Percentage.of(23);

const totalEUR = priceEUR.add(priceEUR.percentage(vatDE));  // €105.91
const totalGBP = priceGBP.add(priceGBP.percentage(vatUK));  // £94.80
const totalPLN = pricePLN.add(pricePLN.percentage(vatPL));  // 490.77 PLN

// Cross-currency arithmetic is prevented
// priceUSD.add(priceEUR); // throws: currency mismatch
```

### Warehouse quantity tracking with units

Track stock levels and reserved quantities with unit-safe arithmetic.

```typescript
import { Quantity, Unit } from '@softwarearchetypes/quantity';

const pieces = Unit.of("pcs");
const kilograms = Unit.of("kg");

let stockApples   = Quantity.of(200, pieces);
let stockBananas  = Quantity.of(150, pieces);
const reserved    = Quantity.of(45, pieces);

// Fulfil an order reservation
stockApples = stockApples.subtract(reserved); // 155 pcs

// Receive a new shipment
const shipment = Quantity.of(300, pieces);
stockApples = stockApples.add(shipment); // 455 pcs

// Bulk weight for shipping manifest
const appleWeight  = Quantity.of(0.2, kilograms); // per apple
const totalWeight  = Quantity.of(stockApples.amount * appleWeight.amount, kilograms); // 91 kg

// Incompatible unit guard
// stockApples.add(totalWeight); // throws: cannot mix pcs and kg
```

### Tax calculations with Percentage and Money

Model multi-rate tax systems (e.g., different VAT bands) and produce an itemised tax breakdown.

```typescript
import { Money, Percentage } from '@softwarearchetypes/quantity';

const standardRate  = Percentage.of(20);
const reducedRate   = Percentage.of(5);
const zeroRate      = Percentage.of(0);

const electronics   = Money.gbp(299.99);  // standard rate
const childrenBooks = Money.gbp(12.99);   // zero rated
const energySaving  = Money.gbp(89.99);   // reduced rate

const electronicsTax   = electronics.percentage(standardRate);    // £60.00
const childrenBooksTax = childrenBooks.percentage(zeroRate);       // £0.00
const energySavingTax  = energySaving.percentage(reducedRate);     // £4.50

const totalNet = electronics.add(childrenBooks).add(energySaving); // £402.97
const totalTax = electronicsTax.add(childrenBooksTax).add(energySavingTax); // £64.50
const totalGross = totalNet.add(totalTax); // £467.47
```

### Unit conversion for logistics (weight, dimensions)

Use Quantity to capture measurements for parcels and compare against carrier limits.

```typescript
import { Quantity, Unit } from '@softwarearchetypes/quantity';

const kg  = Unit.of("kg");
const cm  = Unit.of("cm");

// Parcel dimensions and weight
const parcelWeight = Quantity.of(4.5,  kg);
const parcelLength = Quantity.of(60,   cm);
const parcelWidth  = Quantity.of(40,   cm);
const parcelHeight = Quantity.of(30,   cm);

// Carrier weight limit
const maxWeight = Quantity.of(30, kg);

if (parcelWeight.compareTo(maxWeight) > 0) {
  throw new Error("Parcel exceeds carrier weight limit");
}

// Girth calculation for dimensional weight pricing
const girth = parcelWidth.add(parcelHeight).multiply(2); // 140 cm
const combinedLengthGirth = parcelLength.add(girth);     // 200 cm

// Consolidate multiple parcels in a shipment
const parcel2Weight = Quantity.of(2.0, kg);
const shipmentWeight = parcelWeight.add(parcel2Weight); // 6.5 kg
```
