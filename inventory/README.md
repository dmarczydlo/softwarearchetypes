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

Clone the repository and install locally:

```bash
git clone <repo-url> archetypes-typescript
cd archetypes-typescript
npm install
```

Then link the archetype into your project:

```bash
npm install ../archetypes-typescript/inventory
```

## Dependencies

- `@softwarearchetypes/common`
- `@softwarearchetypes/quantity`

## Quick example

```typescript
import {
  AvailabilityConfiguration,
  InventoryConfiguration,
  InventoryProduct,
  ProductIdentifier,
  CreateInstance,
  CreateInventoryEntry,
} from '@softwarearchetypes/inventory';
import { Quantity, Unit } from '@softwarearchetypes/quantity';

const now = () => new Date();
const availabilityConfig = AvailabilityConfiguration.inMemory(now);
const config = InventoryConfiguration.inMemory(availabilityConfig);
const facade = config.facade();

// Define a product tracked by individual serial number
const laptopId = ProductIdentifier.random();
const laptop = InventoryProduct.individuallyTracked(laptopId, 'MacBook Pro 16');

// Create an inventory entry for the product
const entryId = facade.handle(CreateInventoryEntry.forProduct(laptop)).getSuccess();

// Register a physical instance with a serial number and optional features
const result = facade.createInstance(
  CreateInstance.forProduct(laptopId)
    .withSerial('SN-12345')
    .withFeatures(new Map([['color', 'silver'], ['storage', '256GB']]))
    .build()
);
const instanceId = result.getSuccess();

// Count how many units are in stock
const stock = facade.countProduct(laptopId); // { amount: 1, unit: pieces }

// Find an instance by serial number
const found = facade.findInstanceBySerial(serialNumberOf('SN-12345'));

// Remove an instance from the entry (e.g. sold or retired)
facade.removeInstanceFromEntry(entryId, instanceId);
```

## Real-world usage examples

### Car rental fleet management (Hertz / Enterprise style)

Each vehicle is tracked by VIN. Availability is managed per individual resource so that two customers can never book the same car for an overlapping period.

```typescript
import {
  AvailabilityConfiguration,
  AvailabilityFixture,
  InventoryConfiguration,
  InventoryProduct,
  ProductIdentifier,
  CreateInstance,
  CreateInventoryEntry,
  ReservationConfiguration,
  ReservationPurpose,
  ReserveRequest,
  IndividualSpecification,
  OwnerId,
  ResourceId,
  InstanceId,
  serialNumberOf,
} from '@softwarearchetypes/inventory';
import { Quantity, Unit } from '@softwarearchetypes/quantity';

const now = () => new Date();
const availabilityConfig = AvailabilityConfiguration.inMemory(now);
const inventoryConfig = InventoryConfiguration.inMemory(availabilityConfig);
const reservationConfig = ReservationConfiguration.inMemory(inventoryConfig, availabilityConfig, now);

const inventory = inventoryConfig.facade();
const reservations = reservationConfig.facade();
const availabilityFixture = new AvailabilityFixture(availabilityConfig.facade(), now);

// Register the sedan product category
const sedanId = ProductIdentifier.random();
const sedan = InventoryProduct.individuallyTracked(sedanId, 'Toyota Camry 2024');
const entryId = inventory.handle(CreateInventoryEntry.forProduct(sedan)).getSuccess();

// Add a specific vehicle (VIN is the serial number)
const instanceId = InstanceId.random();
const resourceId = ResourceId.random();
inventory.createInstance(
  CreateInstance.forProduct(sedanId)
    .withSerial('1HGCM82633A123456') // VIN
    .withFeatures(new Map([['color', 'white'], ['transmission', 'automatic']]))
    .build()
);
availabilityFixture.registerIndividual(resourceId);
inventory.mapInstanceToResource(entryId, instanceId, resourceId);

// Customer reserves the vehicle
const customer = OwnerId.random();
const reservation = reservations.handle(
  ReserveRequest.forProduct(sedanId)
    .quantity(Quantity.of(1, Unit.pieces()))
    .owner(customer)
    .purpose(ReservationPurpose.BOOKING)
    .resourceSpecification(IndividualSpecification.of(instanceId))
    .build()
);
// reservation.isSuccess() === true

// A second customer attempting the same car is rejected
const anotherCustomer = OwnerId.random();
const conflict = reservations.handle(
  ReserveRequest.forProduct(sedanId)
    .quantity(Quantity.of(1, Unit.pieces()))
    .owner(anotherCustomer)
    .purpose(ReservationPurpose.BOOKING)
    .resourceSpecification(IndividualSpecification.of(instanceId))
    .build()
);
// conflict.isFailure() === true
```

---

### Hotel room booking (Booking.com style)

Rooms are individually tracked products. Each night is a temporal slot. Multi-night stays lock all required slots atomically — if any night is already taken the entire reservation fails.

```typescript
import {
  AvailabilityConfiguration,
  AvailabilityFixture,
  InventoryConfiguration,
  InventoryProduct,
  ProductIdentifier,
  CreateInventoryEntry,
  ReservationConfiguration,
  ReservationPurpose,
  ReserveRequest,
  TemporalSpecification,
  TimeSlot,
  OwnerId,
  ResourceId,
  InstanceId,
} from '@softwarearchetypes/inventory';
import { Quantity, Unit } from '@softwarearchetypes/quantity';

const now = () => new Date('2024-06-01T10:00:00Z');
const availabilityConfig = AvailabilityConfiguration.inMemory(now);
const inventoryConfig = InventoryConfiguration.inMemory(availabilityConfig);
const reservationConfig = ReservationConfiguration.inMemory(inventoryConfig, availabilityConfig, now);

const inventory = inventoryConfig.facade();
const reservations = reservationConfig.facade();
const availabilityFixture = new AvailabilityFixture(availabilityConfig.facade(), now);

// Register a room type
const deluxeRoomId = ProductIdentifier.random();
const deluxeRoom = InventoryProduct.individuallyTracked(deluxeRoomId, 'Deluxe Ocean View Room');
const entryId = inventory.handle(CreateInventoryEntry.forProduct(deluxeRoom)).getSuccess();

// Register nightly availability for room 412
const resourceId = ResourceId.random();
const instanceId = InstanceId.random();
const checkIn = new Date(Date.UTC(2024, 5, 15)); // June 15
for (let i = 0; i < 5; i++) {
  const night = new Date(Date.UTC(2024, 5, 15 + i));
  availabilityFixture.registerTemporalSlot(resourceId, TimeSlot.ofDay(night));
}
inventory.mapInstanceToResource(entryId, instanceId, resourceId);

// Guest books three consecutive nights (June 15–17)
const guestAnna = OwnerId.random();
const nights = [
  TimeSlot.ofDay(new Date(Date.UTC(2024, 5, 15))),
  TimeSlot.ofDay(new Date(Date.UTC(2024, 5, 16))),
  TimeSlot.ofDay(new Date(Date.UTC(2024, 5, 17))),
];

const booking = reservations.handle(
  ReserveRequest.forProduct(deluxeRoomId)
    .quantity(Quantity.of(1, Unit.pieces()))
    .owner(guestAnna)
    .purpose(ReservationPurpose.BOOKING)
    .resourceSpecification(TemporalSpecification.ofList(nights))
    .build()
);
// booking.isSuccess() === true

// A second guest trying to book the same room on an overlapping night fails
const guestTomek = OwnerId.random();
const overlap = reservations.handle(
  ReserveRequest.forProduct(deluxeRoomId)
    .quantity(Quantity.of(1, Unit.pieces()))
    .owner(guestTomek)
    .purpose(ReservationPurpose.BOOKING)
    .resourceSpecification(TemporalSpecification.of(nights[1])) // June 16 already taken
    .build()
);
// overlap.isFailure() === true

// Anna cancels — room becomes available again
reservations.cancel(booking.getSuccess(), guestAnna);
```

---

### Warehouse management (Amazon fulfillment center style)

Items arriving in the same shipment share a batch ID. Batch tracking lets the warehouse query all units from a particular receipt, enforce FIFO rotation, or isolate a recalled lot.

```typescript
import {
  AvailabilityConfiguration,
  InventoryConfiguration,
  InventoryProduct,
  ProductIdentifier,
  BatchId,
  CreateInstance,
  CreateInventoryEntry,
  InstanceCriteriaFactory,
} from '@softwarearchetypes/inventory';
import { Quantity, Unit } from '@softwarearchetypes/quantity';

const now = () => new Date();
const availabilityConfig = AvailabilityConfiguration.inMemory(now);
const config = InventoryConfiguration.inMemory(availabilityConfig);
const warehouse = config.facade();

// Register a product tracked by batch (e.g. non-serialised consumer goods)
const headphonesId = ProductIdentifier.random();
const headphones = InventoryProduct.batchTracked(headphonesId, 'Sony WH-1000XM5');
warehouse.handle(CreateInventoryEntry.forProduct(headphones));

// Receive shipment A (March batch)
const marchBatch = BatchId.random();
warehouse.createInstance(CreateInstance.forProduct(headphonesId).withBatch(marchBatch).build());
warehouse.createInstance(CreateInstance.forProduct(headphonesId).withBatch(marchBatch).build());
warehouse.createInstance(CreateInstance.forProduct(headphonesId).withBatch(marchBatch).build());

// Receive shipment B (April batch)
const aprilBatch = BatchId.random();
warehouse.createInstance(CreateInstance.forProduct(headphonesId).withBatch(aprilBatch).build());
warehouse.createInstance(CreateInstance.forProduct(headphonesId).withBatch(aprilBatch).build());

// Count entire stock
const totalStock = warehouse.countProduct(headphonesId); // { amount: 5, unit: pieces }

// Count only March batch (e.g. to quarantine a recall)
const marchCount = warehouse.countProduct(
  headphonesId,
  InstanceCriteriaFactory.byBatch(marchBatch)
); // { amount: 3 }

// Retrieve all instances from the March batch for pick/pack
const marchInstances = warehouse.findInstancesByBatch(marchBatch); // array of 3 InstanceView
```

For bulk goods measured by volume or weight, pair batch tracking with explicit quantities:

```typescript
import { Unit } from '@softwarearchetypes/quantity';

const fuelId = ProductIdentifier.random();
const fuel = InventoryProduct.of(fuelId, 'Diesel B7', ProductTrackingStrategy.BATCH_TRACKED, Unit.liters());
warehouse.handle(CreateInventoryEntry.forProduct(fuel));

const tankDelivery = BatchId.random();
warehouse.createInstance(
  CreateInstance.forProduct(fuelId)
    .withBatch(tankDelivery)
    .withQuantity(Quantity.of(8000, Unit.liters()))
    .build()
);

const litresOnHand = warehouse.countProduct(fuelId); // { amount: 8000, unit: liters }
```

---

### Concert / event ticketing (Ticketmaster style)

Seats are individually tracked resources with temporal availability per event date. A seat reservation locks that exact seat for the show — if it's taken, the customer is offered a waitlist position.

```typescript
import {
  AvailabilityConfiguration,
  AvailabilityFixture,
  InventoryConfiguration,
  InventoryProduct,
  ProductIdentifier,
  CreateInstance,
  CreateInventoryEntry,
  ReservationConfiguration,
  ReservationPurpose,
  ReserveRequest,
  IndividualSpecification,
  OwnerId,
  ResourceId,
  InstanceId,
  WaitList,
  WaitListEntry,
} from '@softwarearchetypes/inventory';
import { Quantity, Unit } from '@softwarearchetypes/quantity';

const now = () => new Date();
const availabilityConfig = AvailabilityConfiguration.inMemory(now);
const inventoryConfig = InventoryConfiguration.inMemory(availabilityConfig);
const reservationConfig = ReservationConfiguration.inMemory(inventoryConfig, availabilityConfig, now);

const inventory = inventoryConfig.facade();
const reservations = reservationConfig.facade();
const availabilityFixture = new AvailabilityFixture(availabilityConfig.facade(), now);

// Register seat A12 for the show
const seatProductId = ProductIdentifier.random();
const seatProduct = InventoryProduct.individuallyTracked(seatProductId, 'Seat A12 - Coldplay World Tour');
const entryId = inventory.handle(CreateInventoryEntry.forProduct(seatProduct)).getSuccess();

const instanceId = InstanceId.random();
const resourceId = ResourceId.random();
inventory.createInstance(
  CreateInstance.forProduct(seatProductId).withSerial('A12').build()
);
availabilityFixture.registerIndividual(resourceId);
inventory.mapInstanceToResource(entryId, instanceId, resourceId);

// First fan buys the ticket
const fan1 = OwnerId.random();
const ticketResult = reservations.handle(
  ReserveRequest.forProduct(seatProductId)
    .quantity(Quantity.of(1, Unit.pieces()))
    .owner(fan1)
    .purpose(ReservationPurpose.BOOKING)
    .resourceSpecification(IndividualSpecification.of(instanceId))
    .build()
);
// ticketResult.isSuccess() === true

// Second fan is too late — the seat is taken
const fan2 = OwnerId.random();
const soldOut = reservations.handle(
  ReserveRequest.forProduct(seatProductId)
    .quantity(Quantity.of(1, Unit.pieces()))
    .owner(fan2)
    .purpose(ReservationPurpose.BOOKING)
    .resourceSpecification(IndividualSpecification.of(instanceId))
    .build()
);

if (soldOut.isFailure()) {
  // Add fan2 to a FIFO waitlist for this seat
  const seatWaitlist = WaitList.fifo<string>(50); // max 50 waiting
  seatWaitlist.add(WaitListEntry.of(fan2.id));

  // When fan1 cancels, dequeue the first waiting fan
  reservations.cancel(ticketResult.getSuccess(), fan1);
  const next = seatWaitlist.poll(); // fan2's entry — notify them to complete purchase
}
```

---

### Cloud resource provisioning (AWS EC2 style)

Compute instances are interchangeable pooled resources. Requesting `N` vCPUs locks that quantity from a shared pool — individual identity is irrelevant to the caller.

```typescript
import {
  AvailabilityConfiguration,
  AvailabilityFixture,
  InventoryConfiguration,
  InventoryProduct,
  ProductIdentifier,
  CreateInventoryEntry,
  ReservationConfiguration,
  ReservationPurpose,
  ReserveRequest,
  QuantitySpecification,
  OwnerId,
  ResourceId,
  InstanceId,
} from '@softwarearchetypes/inventory';
import { Quantity, Unit } from '@softwarearchetypes/quantity';

const now = () => new Date();
const availabilityConfig = AvailabilityConfiguration.inMemory(now);
const inventoryConfig = InventoryConfiguration.inMemory(availabilityConfig);
const reservationConfig = ReservationConfiguration.inMemory(inventoryConfig, availabilityConfig, now);

const inventory = inventoryConfig.facade();
const reservations = reservationConfig.facade();
const availabilityFixture = new AvailabilityFixture(availabilityConfig.facade(), now);

// Model a pool of 1 000 on-demand EC2 vCPUs in us-east-1
const ec2OnDemandId = ProductIdentifier.random();
const ec2OnDemand = InventoryProduct.identical(ec2OnDemandId, 'EC2 t3.medium (us-east-1)');
const entryId = inventory.handle(CreateInventoryEntry.forProduct(ec2OnDemand)).getSuccess();

const poolResourceId = ResourceId.random();
const poolInstanceId = InstanceId.random();
availabilityFixture.registerPool(poolResourceId, Quantity.of(1000, Unit.pieces()));
inventory.mapInstanceToResource(entryId, poolInstanceId, poolResourceId);

// Tenant A provisions 200 vCPUs
const tenantA = OwnerId.random();
const provisionA = reservations.handle(
  ReserveRequest.forProduct(ec2OnDemandId)
    .quantity(Quantity.of(200, Unit.pieces()))
    .owner(tenantA)
    .purpose(ReservationPurpose.BOOKING)
    .resourceSpecification(QuantitySpecification.instance())
    .build()
);
// provisionA.isSuccess() === true  (800 vCPUs remain)

// Tenant B provisions 600 vCPUs
const tenantB = OwnerId.random();
const provisionB = reservations.handle(
  ReserveRequest.forProduct(ec2OnDemandId)
    .quantity(Quantity.of(600, Unit.pieces()))
    .owner(tenantB)
    .purpose(ReservationPurpose.BOOKING)
    .resourceSpecification(QuantitySpecification.instance())
    .build()
);
// provisionB.isSuccess() === true  (200 vCPUs remain)

// Tenant C requests 300 vCPUs — pool is exhausted
const tenantC = OwnerId.random();
const denied = reservations.handle(
  ReserveRequest.forProduct(ec2OnDemandId)
    .quantity(Quantity.of(300, Unit.pieces()))
    .owner(tenantC)
    .purpose(ReservationPurpose.BOOKING)
    .resourceSpecification(QuantitySpecification.instance())
    .build()
);
// denied.isFailure() === true

// Tenant A releases their allocation — capacity returns to pool
reservations.cancel(provisionA.getSuccess(), tenantA);
```

---

### Library book management (individual copy tracking with holds)

Each physical copy of a book has a barcode (serial number). When all copies are checked out, interested patrons join a FIFO hold queue and are notified as copies become available. Priority queuing lets library staff fast-track urgent requests.

```typescript
import {
  AvailabilityConfiguration,
  AvailabilityFixture,
  InventoryConfiguration,
  InventoryProduct,
  ProductIdentifier,
  CreateInstance,
  CreateInventoryEntry,
  ReservationConfiguration,
  ReservationPurpose,
  ReserveRequest,
  IndividualSpecification,
  OwnerId,
  ResourceId,
  InstanceId,
  WaitList,
  WaitListEntry,
  serialNumberOf,
} from '@softwarearchetypes/inventory';
import { Quantity, Unit } from '@softwarearchetypes/quantity';

const now = () => new Date();
const availabilityConfig = AvailabilityConfiguration.inMemory(now);
const inventoryConfig = InventoryConfiguration.inMemory(availabilityConfig);
const reservationConfig = ReservationConfiguration.inMemory(inventoryConfig, availabilityConfig, now);

const inventory = inventoryConfig.facade();
const reservations = reservationConfig.facade();
const availabilityFixture = new AvailabilityFixture(availabilityConfig.facade(), now);

// Register the title
const dddBookId = ProductIdentifier.random();
const dddBook = InventoryProduct.individuallyTracked(dddBookId, 'Domain-Driven Design – Evans');
const entryId = inventory.handle(CreateInventoryEntry.forProduct(dddBook)).getSuccess();

// Add two physical copies (barcodes as serial numbers)
function addCopy(barcode: string): { instanceId: InstanceId; resourceId: ResourceId } {
  const instanceId = InstanceId.random();
  const resourceId = ResourceId.random();
  inventory.createInstance(
    CreateInstance.forProduct(dddBookId).withSerial(barcode).build()
  );
  availabilityFixture.registerIndividual(resourceId);
  inventory.mapInstanceToResource(entryId, instanceId, resourceId);
  return { instanceId, resourceId };
}

const copy1 = addCopy('LIB-00123');
const copy2 = addCopy('LIB-00124');

// Patron A borrows copy 1
const patronA = OwnerId.random();
const loan1 = reservations.handle(
  ReserveRequest.forProduct(dddBookId)
    .quantity(Quantity.of(1, Unit.pieces()))
    .owner(patronA)
    .purpose(ReservationPurpose.BOOKING)
    .resourceSpecification(IndividualSpecification.of(copy1.instanceId))
    .build()
);

// Patron B borrows copy 2 — both copies now out
const patronB = OwnerId.random();
const loan2 = reservations.handle(
  ReserveRequest.forProduct(dddBookId)
    .quantity(Quantity.of(1, Unit.pieces()))
    .owner(patronB)
    .purpose(ReservationPurpose.BOOKING)
    .resourceSpecification(IndividualSpecification.of(copy2.instanceId))
    .build()
);

// Patron C and D are too late — join the hold queue
const patronC = OwnerId.random();
const patronD = OwnerId.random();

const holdsQueue = WaitList.fifo<string>(20);
holdsQueue.add(WaitListEntry.of(patronC.id)); // position 1
holdsQueue.add(WaitListEntry.of(patronD.id)); // position 2
// holdsQueue.size() === 2

// Patron A returns the book — next patron on hold is notified
reservations.cancel(loan1.getSuccess(), patronA);
const nextHold = holdsQueue.poll(); // patronC — library sends notification

// Library staff can use priority queue to move urgent requests to the front
const priorityHolds = WaitList.priority<string>(20);
priorityHolds.add(WaitListEntry.of(patronC.id, 2)); // normal priority
priorityHolds.add(WaitListEntry.of('staff-research-request', 1)); // higher priority (lower number = higher)
const urgent = priorityHolds.poll(); // 'staff-research-request' served first
```
