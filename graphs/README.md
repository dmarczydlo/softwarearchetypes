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

Clone the repository and install locally:

```bash
git clone <repo-url> archetypes-typescript
cd archetypes-typescript
npm install
```

Then link the archetype into your project:

```bash
npm install ../archetypes-typescript/graphs
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

```typescript
import {
  Graph, Node, Edge, Path,
  ProcessStep, DependencyType, Process, Schedule,
  DirectedGraph, InfluenceAnalyzer,
  UserJourney, CustomerPath, Condition, ConditionType, State, Product, ProductType,
} from '@softwarearchetypes/graphs';

// --- Cycle detection ---
// Build a directed graph and check whether any cycle exists
const depGraph = new Graph([
  new Edge(new Node("auth-service"),    new Node("user-service")),
  new Edge(new Node("user-service"),    new Node("billing-service")),
  new Edge(new Node("billing-service"), new Node("auth-service")), // cycle!
]);

const hasCycle: boolean = depGraph.hasCycle();
// hasCycle === true  →  circular dependency detected

// --- Process scheduling ---
// Steps carry a duration (in arbitrary time units) and optional resource tags
const checkout  = new ProcessStep("checkout",  1);
const unitTests = new ProcessStep("unit-tests", 4);
const lint      = new ProcessStep("lint",       2);
const build     = new ProcessStep("build",      6);
const deploy    = new ProcessStep("deploy",     3);

const pipeline = new Process([checkout, unitTests, lint, build, deploy], [
  { from: checkout,  to: unitTests, type: DependencyType.FINISH_TO_START },
  { from: checkout,  to: lint,      type: DependencyType.FINISH_TO_START },
  { from: unitTests, to: build,     type: DependencyType.FINISH_TO_START },
  { from: lint,      to: build,     type: DependencyType.FINISH_TO_START },
  { from: build,     to: deploy,    type: DependencyType.FINISH_TO_START },
]);

const pipelineSchedule = Schedule.from(pipeline);
// unitTests and lint run in parallel after checkout

// --- Influence zone analysis ---
// Model a directed graph and compute which nodes are reachable from a failure
const topology = new DirectedGraph([
  new Edge(new Node("router-A"), new Node("switch-1")),
  new Edge(new Node("router-A"), new Node("switch-2")),
  new Edge(new Node("switch-1"), new Node("server-1")),
  new Edge(new Node("switch-1"), new Node("server-2")),
  new Edge(new Node("switch-2"), new Node("server-3")),
]);

const analyzer      = new InfluenceAnalyzer(topology);
const blastRadius   = analyzer.influenceZone(new Node("switch-1"));
// blastRadius contains switch-1, server-1, server-2

// --- User journey modeling ---
// Define a funnel as a state machine: states, products, and transition conditions
const signupState    = new State("signup");
const activatedState = new State("activated");
const subscribedState = new State("subscribed");

const freeTier = new Product("free-tier",  ProductType.FREE);
const proPlan  = new Product("pro-plan",   ProductType.PAID);

const emailVerified   = new Condition(ConditionType.EVENT,   "email_verified");
const upgradeClicked  = new Condition(ConditionType.ACTION,  "upgrade_clicked");

const journey = new UserJourney([
  { from: signupState,    to: activatedState,  condition: emailVerified,  product: freeTier },
  { from: activatedState, to: subscribedState, condition: upgradeClicked, product: proPlan  },
]);

const path: CustomerPath = journey.pathFor("user-42");
```

## Real-world usage examples

### CI/CD pipeline scheduling (GitHub Actions / Jenkins)

Parallel and sequential job steps in a deployment pipeline.

```typescript
import { ProcessStep, DependencyType, Process, Schedule } from '@softwarearchetypes/graphs';

const checkout   = new ProcessStep("checkout",    1);
const unitTests  = new ProcessStep("unit-tests",  4);
const lint       = new ProcessStep("lint",        2);
const e2eTests   = new ProcessStep("e2e-tests",   8);
const buildImage = new ProcessStep("build-image", 5);
const pushImage  = new ProcessStep("push-image",  2);
const deploy     = new ProcessStep("deploy",      3);
const smokeTest  = new ProcessStep("smoke-test",  2);

const pipeline = new Process(
  [checkout, unitTests, lint, e2eTests, buildImage, pushImage, deploy, smokeTest],
  [
    { from: checkout,   to: unitTests,  type: DependencyType.FINISH_TO_START },
    { from: checkout,   to: lint,       type: DependencyType.FINISH_TO_START },
    { from: checkout,   to: e2eTests,   type: DependencyType.FINISH_TO_START },
    { from: unitTests,  to: buildImage, type: DependencyType.FINISH_TO_START },
    { from: lint,       to: buildImage, type: DependencyType.FINISH_TO_START },
    { from: e2eTests,   to: buildImage, type: DependencyType.FINISH_TO_START },
    { from: buildImage, to: pushImage,  type: DependencyType.FINISH_TO_START },
    { from: pushImage,  to: deploy,     type: DependencyType.FINISH_TO_START },
    { from: deploy,     to: smokeTest,  type: DependencyType.FINISH_TO_START },
  ],
);

const schedule = Schedule.from(pipeline);
// unitTests, lint, and e2eTests run in parallel after checkout
// buildImage only starts once all three quality gates pass
// Critical path: checkout → e2eTests → buildImage → pushImage → deploy → smokeTest
```

### Microservice dependency analysis (detecting circular dependencies)

Validate that a service mesh contains no circular call chains before deployment.

```typescript
import { Graph, Node, Edge } from '@softwarearchetypes/graphs';

const services = [
  new Edge(new Node("api-gateway"),    new Node("auth-service")),
  new Edge(new Node("api-gateway"),    new Node("product-service")),
  new Edge(new Node("product-service"),new Node("inventory-service")),
  new Edge(new Node("product-service"),new Node("pricing-service")),
  new Edge(new Node("order-service"),  new Node("product-service")),
  new Edge(new Node("order-service"),  new Node("payment-service")),
  new Edge(new Node("payment-service"),new Node("auth-service")),
  // Uncomment the next line to introduce a circular dependency:
  // new Edge(new Node("auth-service"), new Node("order-service")),
];

const serviceGraph = new Graph(services);

if (serviceGraph.hasCycle()) {
  throw new Error("Circular dependency detected in service mesh — deployment blocked.");
}

// Safe to deploy: no cycles found
const deployOrder = serviceGraph.topologicalSort();
// deployOrder: [auth-service, inventory-service, pricing-service,
//               product-service, payment-service, order-service, api-gateway]
```

### Manufacturing process scheduling (factory floor assembly)

Schedule assembly steps respecting physical dependencies and parallelism constraints.

```typescript
import { ProcessStep, DependencyType, Process, Schedule } from '@softwarearchetypes/graphs';

const frameFab    = new ProcessStep("frame-fabrication",   120); // minutes
const paintFrame  = new ProcessStep("paint-frame",          60);
const engineAssem = new ProcessStep("engine-assembly",      90);
const engineTest  = new ProcessStep("engine-test",          30);
const chasAssem   = new ProcessStep("chassis-assembly",     45);
const electrical  = new ProcessStep("electrical-wiring",    60);
const finalAssem  = new ProcessStep("final-assembly",       75);
const qc          = new ProcessStep("quality-control",      30);

const assembly = new Process(
  [frameFab, paintFrame, engineAssem, engineTest, chasAssem, electrical, finalAssem, qc],
  [
    { from: frameFab,   to: paintFrame,  type: DependencyType.FINISH_TO_START },
    { from: frameFab,   to: engineAssem, type: DependencyType.FINISH_TO_START },
    { from: engineAssem,to: engineTest,  type: DependencyType.FINISH_TO_START },
    { from: paintFrame, to: chasAssem,   type: DependencyType.FINISH_TO_START },
    { from: engineTest, to: chasAssem,   type: DependencyType.FINISH_TO_START },
    { from: chasAssem,  to: electrical,  type: DependencyType.FINISH_TO_START },
    { from: electrical, to: finalAssem,  type: DependencyType.FINISH_TO_START },
    { from: finalAssem, to: qc,          type: DependencyType.FINISH_TO_START },
  ],
);

const factorySchedule = Schedule.from(assembly);
// paintFrame and engineAssem run in parallel after frameFab
// Critical path determines minimum factory lead time
```

### Course prerequisite validation (university enrollment)

Detect impossible course paths caused by circular prerequisites before a student enrols.

```typescript
import { Graph, Node, Edge } from '@softwarearchetypes/graphs';

const prerequisites = [
  new Edge(new Node("CS101-Intro"),         new Node("CS201-DataStructures")),
  new Edge(new Node("CS201-DataStructures"), new Node("CS301-Algorithms")),
  new Edge(new Node("CS201-DataStructures"), new Node("CS302-Databases")),
  new Edge(new Node("MATH101-Calculus"),     new Node("CS301-Algorithms")),
  new Edge(new Node("CS301-Algorithms"),     new Node("CS401-MachineLearning")),
  new Edge(new Node("CS302-Databases"),      new Node("CS401-MachineLearning")),
  // Uncomment to simulate a catalogue data-entry error (circular prereq):
  // new Edge(new Node("CS301-Algorithms"), new Node("CS201-DataStructures")),
];

const curriculum = new Graph(prerequisites);

if (curriculum.hasCycle()) {
  throw new Error("Circular prerequisite detected — course catalogue is invalid.");
}

// Produce a valid study plan ordered from foundational to advanced courses
const studyPlan = curriculum.topologicalSort();
// studyPlan: [CS101, MATH101, CS201, CS302, CS301, CS401]
```

### User onboarding journey (product-led growth funnel)

Model state transitions for a SaaS onboarding funnel driven by user actions.

```typescript
import {
  UserJourney, CustomerPath,
  State, Product, ProductType,
  Condition, ConditionType,
} from '@softwarearchetypes/graphs';

const signedUp     = new State("signed-up");
const profileDone  = new State("profile-complete");
const trialActive  = new State("trial-active");
const converted    = new State("converted");
const churned      = new State("churned");

const noProduct   = new Product("none",       ProductType.FREE);
const trialPlan   = new Product("trial",      ProductType.FREE);
const starterPlan = new Product("starter",    ProductType.PAID);

const profileFilled   = new Condition(ConditionType.ACTION, "profile_filled");
const firstFeatureUsed = new Condition(ConditionType.EVENT, "first_feature_used");
const paymentAdded    = new Condition(ConditionType.ACTION, "payment_added");
const trialExpired    = new Condition(ConditionType.EVENT,  "trial_expired_no_conversion");

const onboarding = new UserJourney([
  { from: signedUp,    to: profileDone, condition: profileFilled,    product: noProduct   },
  { from: profileDone, to: trialActive, condition: firstFeatureUsed, product: trialPlan   },
  { from: trialActive, to: converted,   condition: paymentAdded,     product: starterPlan },
  { from: trialActive, to: churned,     condition: trialExpired,     product: noProduct   },
]);

const userPath: CustomerPath = onboarding.pathFor("user-789");
// Drive the path forward by recording which conditions the user has met
```

### Network topology influence analysis (blast radius when a node fails)

Determine which downstream nodes are affected when a data-centre switch fails.

```typescript
import { DirectedGraph, Node, Edge, InfluenceAnalyzer } from '@softwarearchetypes/graphs';

// Model traffic flow: upstream → downstream
const datacenter = new DirectedGraph([
  new Edge(new Node("core-router"),   new Node("dist-switch-A")),
  new Edge(new Node("core-router"),   new Node("dist-switch-B")),
  new Edge(new Node("dist-switch-A"), new Node("access-sw-1")),
  new Edge(new Node("dist-switch-A"), new Node("access-sw-2")),
  new Edge(new Node("dist-switch-B"), new Node("access-sw-3")),
  new Edge(new Node("access-sw-1"),   new Node("server-rack-1")),
  new Edge(new Node("access-sw-1"),   new Node("server-rack-2")),
  new Edge(new Node("access-sw-2"),   new Node("server-rack-3")),
  new Edge(new Node("access-sw-3"),   new Node("server-rack-4")),
]);

const analyzer    = new InfluenceAnalyzer(datacenter);
const failedNode  = new Node("dist-switch-A");
const blastRadius = analyzer.influenceZone(failedNode);

// blastRadius: [dist-switch-A, access-sw-1, access-sw-2,
//               server-rack-1, server-rack-2, server-rack-3]
// dist-switch-B, access-sw-3, server-rack-4 are unaffected

const impactedServers = blastRadius.filter(n => n.id.startsWith("server-rack"));
console.log(`Failure of ${failedNode.id} takes down ${impactedServers.length} server racks.`);
```
