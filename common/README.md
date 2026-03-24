# @softwarearchetypes/common

## What is this archetype?

The common archetype provides foundational building blocks used across all other software archetypes. It includes a Result monad for error handling without exceptions, Preconditions for defensive programming, a Pair value type, collection transformation utilities, versioning support, and a publish/subscribe event infrastructure.

## When to use this archetype

- You need a Result type (Success/Failure) to handle operations that can fail without throwing exceptions
- You want guard clauses for validating arguments, state, and null checks (Preconditions)
- You need a lightweight in-memory event publishing system for domain events
- You are building on top of any other `@softwarearchetypes/*` package (this is a transitive dependency)
- You need composable results that can be combined, mapped, flat-mapped, or folded
- You want version tracking for domain entities

## Key concepts

- **Result<F, S>** - A monad representing either Success or Failure, with map, flatMap, fold, combine, and peek operations
- **CompositeResult / CompositeSetResult** - Aggregates multiple Results into one
- **Preconditions** - Static guard methods: `checkArgument`, `checkState`, `checkNotNull`
- **Pair<A, B>** - Immutable two-element tuple value object
- **PublishedEvent** - Base type for domain events
- **EventPublisher / EventHandler** - Publish/subscribe infrastructure
- **InMemoryEventsPublisher** - In-memory event bus implementation
- **Version** - Entity version tracking
- **CollectionTransformations** - Utility operations on collections
- **StringUtils** - String manipulation helpers

## Installation

Clone the repository and install locally:

```bash
git clone <repo-url> archetypes-typescript
cd archetypes-typescript
npm install
```

Then link the archetype into your project:

```bash
npm install ../archetypes-typescript/common
```

## Dependencies

None -- this is the foundation package.

## Quick example

```typescript
import { Result, Success, Failure, Preconditions } from '@softwarearchetypes/common';

// Result monad for error handling
function divide(a: number, b: number): Result<string, number> {
  if (b === 0) return new Failure("Division by zero");
  return new Success(a / b);
}

const result = divide(10, 2)
  .map(v => v * 100)
  .peekSuccess(v => console.log(`Result: ${v}`));

// Preconditions for validation
Preconditions.checkArgument(amount > 0, "Amount must be positive");
Preconditions.checkNotNull(name, "Name is required");
```

### CompositeResult: aggregating multiple Results

```typescript
import { CompositeResult, Success, Failure } from '@softwarearchetypes/common';

const nameResult: Result<string, string> = validateName(name);
const emailResult: Result<string, string> = validateEmail(email);
const ageResult: Result<string, number> = validateAge(age);

const composite = CompositeResult.of(nameResult, emailResult, ageResult);

if (composite.isSuccess()) {
  // All validations passed
  console.log("All fields valid");
} else {
  // Collect all failure messages
  composite.peekFailure(errors => console.error("Validation errors:", errors));
}
```

### Event publishing with InMemoryEventsPublisher

```typescript
import {
  PublishedEvent,
  InMemoryEventsPublisher,
  EventHandler,
} from '@softwarearchetypes/common';

// Define a domain event
class UserRegistered extends PublishedEvent {
  constructor(readonly userId: string, readonly email: string) {
    super();
  }
}

// Set up the publisher and a handler
const publisher = new InMemoryEventsPublisher();

const handler: EventHandler<UserRegistered> = {
  handle: async (event: UserRegistered) => {
    console.log(`Sending welcome email to ${event.email}`);
  },
};

publisher.subscribe(UserRegistered, handler);

// Publish an event
await publisher.publish(new UserRegistered("u-123", "alice@example.com"));
```

### Version tracking for domain entities

```typescript
import { Version } from '@softwarearchetypes/common';

const initial = Version.initial();        // version 0
const next = initial.next();              // version 1
const again = next.next();                // version 2

console.log(initial.value);  // 0
console.log(next.value);     // 1

// Useful for optimistic concurrency checks
function updateEntity(entity: MyEntity, expectedVersion: Version): Result<string, MyEntity> {
  if (!entity.version.equals(expectedVersion)) {
    return new Failure("Concurrent modification detected");
  }
  return new Success({ ...entity, version: entity.version.next() });
}
```

## Real-world usage examples

### API response handling

Wrap service-layer outcomes in `Result` to give controllers a uniform response shape without throwing exceptions:

```typescript
import { Result, Success, Failure } from '@softwarearchetypes/common';

async function getUserById(id: string): Promise<Result<string, User>> {
  const user = await userRepository.findById(id);
  if (!user) return new Failure(`User ${id} not found`);
  return new Success(user);
}

// In an Express handler:
app.get('/users/:id', async (req, res) => {
  const result = await getUserById(req.params.id);
  result.fold(
    error => res.status(404).json({ error }),
    user  => res.status(200).json(user),
  );
});
```

### Form validation

Use `CompositeResult` to run all field validations in one pass and surface every error at once instead of stopping at the first failure:

```typescript
import { CompositeResult, Result, Success, Failure, Preconditions } from '@softwarearchetypes/common';

function validateUsername(value: string): Result<string, string> {
  if (!value || value.length < 3) return new Failure("Username must be at least 3 characters");
  if (/[^a-z0-9_]/i.test(value)) return new Failure("Username may only contain letters, digits, and underscores");
  return new Success(value);
}

function validatePassword(value: string): Result<string, string> {
  if (value.length < 8) return new Failure("Password must be at least 8 characters");
  return new Success(value);
}

function validateRegistrationForm(form: { username: string; password: string }) {
  const composite = CompositeResult.of(
    validateUsername(form.username),
    validatePassword(form.password),
  );

  return composite.fold(
    errors => ({ ok: false, errors }),
    _      => ({ ok: true,  errors: [] }),
  );
}
```

### Domain event publishing in microservices

Use `InMemoryEventsPublisher` inside a bounded context to decouple side-effects (emails, audit logs, downstream calls) from core business logic:

```typescript
import { PublishedEvent, InMemoryEventsPublisher } from '@softwarearchetypes/common';

class OrderPlaced extends PublishedEvent {
  constructor(readonly orderId: string, readonly totalAmount: number) { super(); }
}

class InventoryReserved extends PublishedEvent {
  constructor(readonly orderId: string, readonly items: string[]) { super(); }
}

const bus = new InMemoryEventsPublisher();

// Wire up handlers (e.g., in your DI container setup)
bus.subscribe(OrderPlaced, {
  handle: async (e) => await notificationService.sendOrderConfirmation(e.orderId),
});
bus.subscribe(OrderPlaced, {
  handle: async (e) => await auditLog.record("order.placed", e.orderId),
});
bus.subscribe(InventoryReserved, {
  handle: async (e) => await warehouseService.pick(e.orderId, e.items),
});

// In the application service — no knowledge of side-effects required
async function placeOrder(command: PlaceOrderCommand) {
  const order = Order.create(command);
  await orderRepository.save(order);
  await bus.publish(new OrderPlaced(order.id, order.totalAmount));
  await bus.publish(new InventoryReserved(order.id, order.itemIds));
}
```

### Input validation middleware

Use `Preconditions` as lightweight guard clauses at the boundary of any function or class method to fail fast with descriptive messages:

```typescript
import { Preconditions } from '@softwarearchetypes/common';

class TransferService {
  transfer(fromAccountId: string, toAccountId: string, amount: number): void {
    Preconditions.checkNotNull(fromAccountId, "Source account ID is required");
    Preconditions.checkNotNull(toAccountId, "Destination account ID is required");
    Preconditions.checkArgument(amount > 0, "Transfer amount must be positive");
    Preconditions.checkArgument(fromAccountId !== toAccountId, "Cannot transfer to the same account");
    Preconditions.checkState(this.isOpen, "Service is not accepting transfers at this time");

    // Proceed with the transfer knowing all invariants hold
  }
}
```
