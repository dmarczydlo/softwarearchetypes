# @softwarearchetypes/ordering

## What is this archetype?

The ordering archetype models the complete order lifecycle: creation, line item management, multi-party roles, pricing, payment, fulfillment, billing, and inventory allocation. Orders have typed statuses with transition rules, line items with specifications and pricing breakdowns, and multiple parties playing roles at both order and line-item level. Service integration points (pricing, payment, fulfillment, billing, inventory) are defined as interfaces for pluggable implementations.

## When to use this archetype

- You need to model orders with line items, quantities, and pricing
- You have multi-party orders (buyer, seller, shipper, insurer) with roles at order or line-item level
- You need order status management with controlled transitions (draft, confirmed, fulfilled, cancelled)
- You want fulfillment tracking per line item
- You need pluggable service interfaces for pricing, payment, fulfillment, billing, and inventory
- You are building e-commerce, B2B ordering, procurement, or marketplace systems
- You need role validation policies (e.g., exactly one buyer, at least one seller)

## Key concepts

- **Order** - The aggregate root; holds parties, line items, status. Built via OrderBuilder
- **OrderLine** - A line item with product identifier, quantity, specification, and pricing
- **OrderParties / PartyInOrder** - Parties and their roles in the order (buyer, seller, etc.)
- **RoleInOrder** - Typed roles parties can play
- **OrderStatus** - Draft, Confirmed, InFulfillment, Fulfilled, Cancelled -- with transition rules
- **FulfillmentStatus** - Tracks fulfillment progress per line item
- **OrderLinePricing** - Price state: CalculatedPricing, EstimatedPricing, ArbitraryPricing, NotPricedYet
- **PriceBreakdown** - Detailed price decomposition for a line item
- **RoleValidationPolicy** - Rules for required/allowed party roles (OrderLevelRolePolicy, OrderLineLevelRolePolicy)
- **PricingService / PaymentService / FulfillmentService / BillingService / InventoryService** - Pluggable service interfaces
- **OrderingFacade** - High-level API for order management commands
- **OrderingConfiguration** - Wires up all services, repositories, and the facade

## Installation

```bash
npm install @softwarearchetypes/ordering
```

## Dependencies

- `@softwarearchetypes/common`
- `@softwarearchetypes/quantity`

## Quick example

```typescript
import { OrderBuilder, RoleInOrder, OrderStatus } from '@softwarearchetypes/ordering';
import { Money } from '@softwarearchetypes/quantity';

const order = new OrderBuilder()
  .withParty({ partyId: "BUYER-1", role: RoleInOrder.BUYER })
  .withParty({ partyId: "SELLER-1", role: RoleInOrder.SELLER })
  .withLine({
    productId: "PROD-001",
    quantity: 2,
    description: "Laptop Pro 16",
  })
  .build();
```
