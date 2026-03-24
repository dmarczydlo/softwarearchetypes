# @softwarearchetypes/archetypes

A catalogue of reusable software archetypes implemented in TypeScript. Each archetype captures a recurring structural pattern found across many business domains, packaged as an independent, installable npm module.

> **Attribution**: This is a TypeScript rewrite of the original Java [archetypes](https://github.com/Software-Archetypes/archetypes) project by Bartłomiej Słota, Jakub Pilimon, and Sławomir Sobótka. Licensed under [CC BY-NC-SA 4.0](./LICENSE) — non-commercial use only, same license applies to derivatives.

## Archetype Catalogue

| Package                                                    | Description                                                 | When to reach for it                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`@softwarearchetypes/common`](./common)                   | Result monad, Preconditions, Pair, event publishing         | Foundation for all other archetypes; error handling without exceptions |
| [`@softwarearchetypes/quantity`](./quantity)               | Quantity/Unit, Money, Percentage                            | Modeling measured amounts, currencies, percentages                     |
| [`@softwarearchetypes/accounting`](./accounting)           | Double-entry bookkeeping, transactions, posting rules       | Ledgers, wallets, balanced two-sided tracking                          |
| [`@softwarearchetypes/pricing`](./pricing)                 | Calculators, step functions, composite pricing              | Tariffs, rate cards, tiered/graduated pricing, subscription billing    |
| [`@softwarearchetypes/product`](./product)                 | Product types, instances, features, packages, relationships | Product catalogs, configurable products, bundles                       |
| [`@softwarearchetypes/party`](./party)                     | Persons, organizations, addresses, roles, capabilities      | CRM, identity, contact management, org structures                      |
| [`@softwarearchetypes/inventory`](./inventory)             | Instances, availability, reservations, waitlists            | Warehouse, rental, booking, resource management                        |
| [`@softwarearchetypes/ordering`](./ordering)               | Orders, line items, fulfillment, multi-party roles          | E-commerce, B2B ordering, procurement, marketplaces                    |
| [`@softwarearchetypes/graphs`](./graphs)                   | Cycles, scheduling, influence zones, user journeys          | Graph algorithms, process scheduling, state machines                   |
| [`@softwarearchetypes/rules`](./rules)                     | Discount chains, visitor modifiers, scoring algebra         | Promotions, loyalty rules, credit scoring, rating engines              |
| [`@softwarearchetypes/planvsexecution`](./planvsexecution) | Plan vs execution delta analysis                            | Production tracking, repayment monitoring, SLA/variance analysis       |

## How to identify which archetype you need

Use the keyword signals below to match your domain problem to the right archetype.

**Money, amounts, currencies, arithmetic on values, percentages, unit conversion**
-> Start with `quantity`. If you also need ledger balancing, add `accounting`.

**Accounts, ledger, debit, credit, balance, journal, double-entry, posting rules, wallets**
-> Use `accounting`.

**Price calculation, tariff, rate card, tiers, step function, volume discount, composite pricing, billing formula**
-> Use `pricing`.

**Product catalog, product type, features, configurable product, bundles, packages, serial number, SKU, product relationships**
-> Use `product`.

**Person, organization, company, address, email, phone, role, capability, CRM, contact, identity, relationship between people/orgs**
-> Use `party`.

**Stock, inventory, warehouse, availability, reservation, booking, waitlist, resource allocation, serial tracking, batch**
-> Use `inventory`.

**Order, cart, line item, checkout, fulfillment, shipment, payment, buyer, seller, marketplace, procurement**
-> Use `ordering`.

**Graph, cycle detection, scheduling, dependencies, process steps, influence, adjacency, user journey, state machine**
-> Use `graphs`.

**Discount, promotion, coupon, loyalty, scoring, rating, rule engine, predicate, chain of responsibility, fuzzy logic**
-> Use `rules`.

**Plan vs actual, forecast vs result, delta, variance, tolerance, overproduction, underproduction, late payment, schedule adherence, SLA**
-> Use `planvsexecution`.

**Error handling, Result monad, event publishing, preconditions, guard clauses**
-> Use `common` (also included transitively by most other archetypes).

## Installation

### From GitHub (recommended)

Install individual archetypes directly from the GitHub repository — no npm registry needed:

```bash
# Install a single archetype (replace <github-user> with the actual user/org)
npm install github:<github-user>/archetypes-typescript#main --workspace=common
npm install github:<github-user>/archetypes-typescript#main --workspace=accounting

# Or add to package.json manually:
# "@softwarearchetypes/common": "github:<github-user>/archetypes-typescript#main"
```

### From a local clone

```bash
git clone <repo-url> archetypes-typescript
cd archetypes-typescript
npm install    # installs all workspaces
npm run build  # builds all archetypes
npm test       # runs all 885 tests
```

Then link into your project:

```bash
# From your project directory
npm install ../archetypes-typescript/common
npm install ../archetypes-typescript/accounting
# or use npm link for development
```

### Git submodule

```bash
# Add as a submodule in your project
git submodule add <repo-url> lib/archetypes
# Then reference in your tsconfig.json paths
```

## Architecture and composition

### Dependency graph

```
common (no deps)
  |
  +-- quantity (common)
  |     |
  |     +-- accounting (common, quantity)
  |     +-- pricing (quantity)
  |     +-- product (common, quantity)
  |     +-- inventory (common, quantity)
  |     +-- ordering (common, quantity)
  |     +-- graphs (common, quantity)
  |     +-- rules (quantity)
  |     +-- planvsexecution (quantity)
  |
  +-- party (common)
```

### Design principles

1. **Each archetype is self-contained.** Install only the archetypes your domain needs. No God package.
2. **Type-level vs instance-level separation.** Archetypes like `product` distinguish between definitions (types, templates) and concrete instances (configured items).
3. **Facade pattern.** Each archetype exposes a high-level Facade class as its primary API, hiding internal complexity.
4. **In-memory repositories included.** Every archetype ships with in-memory repository implementations for testing and prototyping. Swap them for your persistence layer in production.
5. **Event-driven integration.** Archetypes publish domain events (via `common`'s event infrastructure) so they can be composed without tight coupling.
6. **Builder pattern.** Complex aggregates are constructed via fluent builders rather than large constructor signatures.
7. **Composability over inheritance.** Archetypes are designed to be composed together (e.g., `ordering` + `pricing` + `inventory`) rather than extended via class hierarchies.

### Combining archetypes

Real systems typically compose multiple archetypes. Common combinations:

- **E-commerce**: `product` + `pricing` + `inventory` + `ordering` + `party`
- **Financial services**: `accounting` + `rules` + `planvsexecution` + `quantity`
- **Subscription platform**: `product` + `pricing` + `ordering` + `accounting`
- **Manufacturing**: `product` + `inventory` + `planvsexecution` + `graphs`
- **Marketplace**: `party` + `product` + `ordering` + `rules`
