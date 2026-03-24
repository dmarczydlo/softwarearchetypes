# @softwarearchetypes/inventory

## What is this archetype?

The inventory archetype manages product instances, their availability, reservations, and waitlists. It supports multiple tracking strategies (individual serial numbers, batch tracking, interchangeable pool), availability models (individual resource calendars, pooled quantity, temporal slots), a reservation system with locking, and waitlist management for out-of-stock scenarios.

## When to use this archetype

- You need to track inventory of physical or virtual items
- You are modeling individual items with serial numbers vs. interchangeable pooled stock
- You need availability checking: is a specific resource free at a given time? How many units are available?
- You need reservations with time-based locking and expiration
- You want waitlist functionality for items that are currently unavailable
- You are building warehouse management, rental systems, appointment scheduling, or resource booking
- You need batch tracking for products manufactured or received together

## Key concepts

- **Instance / ProductInstance** - A tracked item in inventory, created via InstanceBuilder
- **InventoryEntry** - An inventory record linking a product to its stock/location
- **ProductTrackingStrategy** - How items are tracked: individually (serial numbers), by batch, or as interchangeable pool
- **SerialNumber** - Unique identifier for individually tracked items (TextualSerialNumber, VIN, IMEI)
- **ResourceSpecification** - Describes a resource: TemporalSpecification (time-slotted), IndividualSpecification (unique items), QuantitySpecification (pooled count)
- **Availability submodule** - Individual resource calendars, pool-based quantity availability, temporal slot availability
- **Reservation submodule** - Reserve resources with time-based locks, confirm or release reservations
- **Waitlist submodule** - Queue interested parties when resources are unavailable
- **InventoryFacade** - High-level API for managing instances and inventory entries
- **InventoryConfiguration** - Wires up repositories and facades

## Installation

```bash
npm install @softwarearchetypes/inventory
```

## Dependencies

- `@softwarearchetypes/common`
- `@softwarearchetypes/quantity`

## Quick example

```typescript
import { InventoryConfiguration, CreateInstanceBuilder, ProductTrackingStrategy } from '@softwarearchetypes/inventory';

const config = InventoryConfiguration.inMemory();
const facade = config.inventoryFacade();

// Create an individually tracked product instance
const instance = facade.createInstance(
  new CreateInstanceBuilder()
    .withProductId("LAPTOP-001")
    .withSerialNumber("SN-12345")
    .withTrackingStrategy(ProductTrackingStrategy.INDIVIDUAL)
    .build()
);

// Check availability, make reservations, manage waitlists
```
