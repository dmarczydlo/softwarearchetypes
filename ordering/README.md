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

Clone the repository and install locally:

```bash
git clone <repo-url> archetypes-typescript
cd archetypes-typescript
npm install
```

Then link the archetype into your project:

```bash
npm install ../archetypes-typescript/ordering
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

### Confirming and fulfilling an order

```typescript
import {
  OrderBuilder,
  OrderingConfiguration,
  RoleInOrder,
  OrderStatus,
} from '@softwarearchetypes/ordering';

// Wire up the facade with your service implementations
const { facade } = new OrderingConfiguration({
  pricingService: myPricingService,
  paymentService: myPaymentService,
  fulfillmentService: myFulfillmentService,
  billingService: myBillingService,
  inventoryService: myInventoryService,
  orderRepository: myOrderRepository,
}).build();

// Create and confirm an order
const order = new OrderBuilder()
  .withParty({ partyId: "BUYER-1", role: RoleInOrder.BUYER })
  .withParty({ partyId: "SELLER-1", role: RoleInOrder.SELLER })
  .withLine({ productId: "PROD-001", quantity: 2, description: "Laptop Pro 16" })
  .withLine({ productId: "PROD-002", quantity: 1, description: "USB-C Dock" })
  .build();

await facade.confirm(order.orderId);
await facade.startFulfillment(order.orderId);
await facade.markFulfilled(order.orderId);
```

### Role validation policy

```typescript
import {
  OrderBuilder,
  OrderLevelRolePolicy,
  RoleInOrder,
} from '@softwarearchetypes/ordering';

// Enforce exactly one buyer and at least one seller
const policy = new OrderLevelRolePolicy([
  { role: RoleInOrder.BUYER,  min: 1, max: 1 },
  { role: RoleInOrder.SELLER, min: 1 },
]);

const order = new OrderBuilder()
  .withRoleValidationPolicy(policy)
  .withParty({ partyId: "BUYER-1",  role: RoleInOrder.BUYER })
  .withParty({ partyId: "SELLER-1", role: RoleInOrder.SELLER })
  .withLine({ productId: "PROD-001", quantity: 3, description: "Mechanical Keyboard" })
  .build(); // throws if validation fails
```

---

## Real-world usage examples

### E-commerce checkout (Shopify-style)

A direct-to-consumer storefront where a single merchant sells to an end customer. The order captures the buyer, the merchant as seller, a shipper for delivery, and a full price breakdown with tax and shipping costs.

```typescript
import {
  OrderBuilder,
  RoleInOrder,
  OrderLevelRolePolicy,
  OrderingConfiguration,
  CalculatedPricing,
  PriceBreakdown,
} from '@softwarearchetypes/ordering';

const policy = new OrderLevelRolePolicy([
  { role: RoleInOrder.BUYER,   min: 1, max: 1 },
  { role: RoleInOrder.SELLER,  min: 1, max: 1 },
  { role: RoleInOrder.SHIPPER, min: 0, max: 1 },
]);

const checkout = new OrderBuilder()
  .withRoleValidationPolicy(policy)
  .withParty({ partyId: "CUSTOMER-42",   role: RoleInOrder.BUYER })
  .withParty({ partyId: "MERCHANT-ACME", role: RoleInOrder.SELLER })
  .withParty({ partyId: "UPS",           role: RoleInOrder.SHIPPER })
  .withLine({
    productId: "SKU-SHOE-RED-10",
    quantity: 1,
    description: "Running Shoe - Red, Size 10",
    pricing: new CalculatedPricing(
      new PriceBreakdown({
        basePrice:     Money.of(89.99, "USD"),
        tax:           Money.of(7.20,  "USD"),
        shippingCost:  Money.of(5.99,  "USD"),
        discount:      Money.of(10.00, "USD"),
      })
    ),
  })
  .build();

const { facade } = new OrderingConfiguration({ /* services */ }).build();
await facade.confirm(checkout.orderId);
```

---

### B2B procurement (SAP-style purchase orders with approval workflow)

Corporate purchasing often requires a multi-step approval chain before an order is confirmed. The order stays in `Draft` status while approvers are added as parties; a domain event or workflow engine advances status only once all required approvals are recorded.

```typescript
import {
  OrderBuilder,
  RoleInOrder,
  OrderLevelRolePolicy,
  OrderStatus,
} from '@softwarearchetypes/ordering';

// Custom roles for procurement
const APPROVER = "APPROVER" as RoleInOrder;
const COST_CENTER = "COST_CENTER" as RoleInOrder;

const policy = new OrderLevelRolePolicy([
  { role: RoleInOrder.BUYER, min: 1, max: 1 },
  { role: RoleInOrder.SELLER, min: 1 },
  { role: APPROVER, min: 1 },         // at least one approver required
  { role: COST_CENTER, min: 1, max: 1 },
]);

const po = new OrderBuilder()
  .withRoleValidationPolicy(policy)
  .withParty({ partyId: "EMP-007",          role: RoleInOrder.BUYER })
  .withParty({ partyId: "VENDOR-DELL",      role: RoleInOrder.SELLER })
  .withParty({ partyId: "MANAGER-JONES",    role: APPROVER })
  .withParty({ partyId: "CC-ENGINEERING",   role: COST_CENTER })
  .withLine({
    productId: "DELL-SVR-R740",
    quantity: 4,
    description: "Dell PowerEdge R740 Server",
    specification: { deliveryWeeks: 6, warrantyYears: 3 },
  })
  .build();
// po.status === OrderStatus.DRAFT  -- awaiting approval workflow
```

---

### Food delivery marketplace (Uber Eats / DoorDash style)

Three distinct parties — restaurant, delivery driver, and end customer — each play a different role. Fulfillment is tracked at the line-item level so the kitchen and the driver can update their own portions independently.

```typescript
import {
  OrderBuilder,
  OrderLineLevelRolePolicy,
  RoleInOrder,
} from '@softwarearchetypes/ordering';

const RESTAURANT = "RESTAURANT" as RoleInOrder;
const DRIVER     = "DRIVER"     as RoleInOrder;

// Require at least one restaurant and one driver per line item
const linePolicy = new OrderLineLevelRolePolicy([
  { role: RESTAURANT, min: 1, max: 1 },
  { role: DRIVER,     min: 1, max: 1 },
]);

const deliveryOrder = new OrderBuilder()
  .withRoleValidationPolicy(linePolicy)
  .withParty({ partyId: "CUSTOMER-99",     role: RoleInOrder.BUYER })
  .withParty({ partyId: "RESTO-PIZZATOWN", role: RESTAURANT })
  .withParty({ partyId: "DRIVER-DAN",      role: DRIVER })
  .withLine({
    productId: "MENU-MARGHERITA-L",
    quantity: 2,
    description: "Margherita Pizza (Large)",
    parties: [
      { partyId: "RESTO-PIZZATOWN", role: RESTAURANT },
      { partyId: "DRIVER-DAN",      role: DRIVER },
    ],
  })
  .withLine({
    productId: "MENU-TIRAMISU",
    quantity: 1,
    description: "Tiramisu",
    parties: [
      { partyId: "RESTO-PIZZATOWN", role: RESTAURANT },
      { partyId: "DRIVER-DAN",      role: DRIVER },
    ],
  })
  .build();
```

---

### Subscription box service (monthly recurring orders)

A subscription box generates a new order each billing cycle from a fixed template. Each order references the subscription contract as metadata, and the pricing is estimated until the contents are curated for that month.

```typescript
import {
  OrderBuilder,
  RoleInOrder,
  EstimatedPricing,
} from '@softwarearchetypes/ordering';
import { Money } from '@softwarearchetypes/quantity';

function createMonthlyBoxOrder(subscriptionId: string, cycleDate: string) {
  return new OrderBuilder()
    .withParty({ partyId: "SUBSCRIBER-451", role: RoleInOrder.BUYER })
    .withParty({ partyId: "BOXCO-HQ",       role: RoleInOrder.SELLER })
    .withMetadata({ subscriptionId, billingCycle: cycleDate })
    .withLine({
      productId: "BOX-BEAUTY-MARCH-2026",
      quantity: 1,
      description: "March 2026 Beauty Box",
      pricing: new EstimatedPricing(Money.of(39.99, "USD")),
    })
    .build();
}

// Called by a scheduler each month
const marchOrder = createMonthlyBoxOrder("SUB-7821", "2026-03");
```

---

### Marketplace multi-seller orders (Amazon-style split fulfillment)

A customer adds items from different sellers to a single cart. The platform creates one logical order but splits fulfillment per seller, modelled here with per-line-item seller roles so each seller only sees their own lines.

```typescript
import {
  OrderBuilder,
  OrderLineLevelRolePolicy,
  RoleInOrder,
  CalculatedPricing,
  PriceBreakdown,
} from '@softwarearchetypes/ordering';
import { Money } from '@softwarearchetypes/quantity';

const linePolicy = new OrderLineLevelRolePolicy([
  { role: RoleInOrder.SELLER, min: 1, max: 1 },
]);

const marketplaceOrder = new OrderBuilder()
  .withRoleValidationPolicy(linePolicy)
  .withParty({ partyId: "CUSTOMER-303", role: RoleInOrder.BUYER })
  // Sellers are declared at order level for reference
  .withParty({ partyId: "SELLER-TECHGADGETS", role: RoleInOrder.SELLER })
  .withParty({ partyId: "SELLER-BOOKSHELF",   role: RoleInOrder.SELLER })
  .withLine({
    productId: "TG-HEADPHONES-XM5",
    quantity: 1,
    description: "Noise-Cancelling Headphones XM5",
    parties: [{ partyId: "SELLER-TECHGADGETS", role: RoleInOrder.SELLER }],
    pricing: new CalculatedPricing(
      new PriceBreakdown({ basePrice: Money.of(299.00, "USD") })
    ),
  })
  .withLine({
    productId: "BOOK-DDD-EVANS",
    quantity: 2,
    description: "Domain-Driven Design (Evans)",
    parties: [{ partyId: "SELLER-BOOKSHELF", role: RoleInOrder.SELLER }],
    pricing: new CalculatedPricing(
      new PriceBreakdown({ basePrice: Money.of(54.98, "USD") })
    ),
  })
  .build();
// Each seller's fulfillment service receives only the lines assigned to them
```

---

### Wholesale ordering (bulk orders with minimum quantities and tiered pricing)

Wholesale buyers commit to large quantities and expect tiered discounts. Minimum order quantities and pricing tiers are enforced at the line-item level; estimated pricing is replaced with calculated pricing once the tiered rate is confirmed.

```typescript
import {
  OrderBuilder,
  RoleInOrder,
  OrderLevelRolePolicy,
  EstimatedPricing,
  CalculatedPricing,
  PriceBreakdown,
} from '@softwarearchetypes/ordering';
import { Money } from '@softwarearchetypes/quantity';

const DISTRIBUTOR = "DISTRIBUTOR" as RoleInOrder;

const policy = new OrderLevelRolePolicy([
  { role: RoleInOrder.BUYER, min: 1, max: 1 },
  { role: RoleInOrder.SELLER, min: 1, max: 1 },
  { role: DISTRIBUTOR, min: 0, max: 1 },
]);

function tieredUnitPrice(qty: number): Money {
  if (qty >= 1000) return Money.of(8.50,  "USD");
  if (qty >= 500)  return Money.of(9.25,  "USD");
  if (qty >= 100)  return Money.of(10.00, "USD");
  return Money.of(12.00, "USD");
}

const MIN_ORDER_QTY = 100;
const requestedQty  = 750; // buyer requests 750 units

if (requestedQty < MIN_ORDER_QTY) {
  throw new Error(`Minimum order quantity is ${MIN_ORDER_QTY} units`);
}

const unitPrice  = tieredUnitPrice(requestedQty);
const totalPrice = Money.of(unitPrice.amount * requestedQty, "USD");

const wholesaleOrder = new OrderBuilder()
  .withRoleValidationPolicy(policy)
  .withParty({ partyId: "RETAILER-BIGBOX",   role: RoleInOrder.BUYER })
  .withParty({ partyId: "MANUFACTURER-ACME", role: RoleInOrder.SELLER })
  .withParty({ partyId: "DIST-MIDWEST",      role: DISTRIBUTOR })
  .withLine({
    productId:   "ACME-WIDGET-PRO",
    quantity:    requestedQty,
    description: "Widget Pro (bulk)",
    specification: {
      minimumOrderQty: MIN_ORDER_QTY,
      appliedTier:     "500-999",
      unitPrice:       unitPrice.amount,
    },
    pricing: new CalculatedPricing(
      new PriceBreakdown({
        basePrice: totalPrice,
        discount:  Money.of(0, "USD"), // already reflected in tiered price
      })
    ),
  })
  .build();
```
