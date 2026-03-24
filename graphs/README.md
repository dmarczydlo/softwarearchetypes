# @softwarearchetypes/graphs

## What is this archetype?

The graphs archetype provides graph-based modeling patterns for four distinct domains: cycle detection and slot reservation, process scheduling with dependencies and concurrency, influence zone analysis for laboratory/physics environments, and user journey modeling with conditions and state transitions. Each sub-module uses directed graph structures adapted to its specific domain.

## When to use this archetype

- You need cycle detection in directed graphs
- You are modeling slot-based reservation systems (time slots, resource slots)
- You need process scheduling with dependencies, concurrency limits, and execution environments
- You are analyzing influence zones or adjacency relationships (e.g., laboratory equipment placement, physics processes)
- You want to model user journeys as state machines with conditions and product transitions
- You need graph algorithms: path finding, topological ordering, scheduling optimization

## Key concepts

### Cycles & Reservation
- **Node / Edge / Path / Graph** - Core graph primitives for cycle detection
- **Slot / SlotRepository / BatchReservationUseCase** - Time/resource slot reservation with eligibility checks

### Scheduling
- **ProcessStep** - A unit of work with duration and resource requirements
- **DependencyType** - How steps relate (finish-to-start, start-to-start, etc.)
- **Process** - A collection of steps with dependencies
- **Schedule** - Computed schedule with start/end times respecting dependencies
- **Concurrency / ExecutionEnvironments** - Constraints on parallel execution

### Influence
- **DirectedGraph / SimpleGraph** - Graph structures for influence analysis
- **InfluenceZone / InfluenceMap / InfluenceAnalyzer** - Zone-based influence propagation
- **Laboratory / PhysicsProcess / BridgingReservations** - Domain-specific influence modeling

### User Journey
- **UserJourney** - A journey through states driven by conditions
- **CustomerPath** - The path a customer takes through products/states
- **Condition / ConditionType** - Rules that trigger state transitions
- **State / Product / ProductType** - Journey nodes and their types

## Installation

```bash
npm install @softwarearchetypes/graphs
```

## Dependencies

- `@softwarearchetypes/common`
- `@softwarearchetypes/quantity`

## Quick example

```typescript
import { Graph, Node, Edge, ProcessStep, Process, Schedule } from '@softwarearchetypes/graphs';

// Cycle detection
const graph = new Graph([
  new Edge(new Node("A"), new Node("B")),
  new Edge(new Node("B"), new Node("C")),
]);

// Process scheduling
const step1 = new ProcessStep("Design", 5);
const step2 = new ProcessStep("Build", 10);
const process = new Process([step1, step2]);
const schedule = Schedule.from(process);
```
