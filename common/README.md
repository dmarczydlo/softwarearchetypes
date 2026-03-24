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

```bash
npm install @softwarearchetypes/common
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
