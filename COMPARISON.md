# Java vs TypeScript Archetypes: Comparison Report

## Summary Table

| Archetype | Java Src | Java Test | Java LOC | TS Src | TS Test | TS LOC | TS/Java LOC % |
|---|---|---|---|---|---|---|---|
| common | 10 | 4 | 1,607 | 11 | 4 | 1,292 | 80% |
| quantity | 4 | 4 | 1,871 | 5 | 4 | 788 | 42% |
| accounting | 50 | 17 | 6,403 | 55 | 13 | 4,992 | 78% |
| pricing | 25 | 28 | 11,016 | 24 | 8 | 4,427 | 40% |
| product | 67 | 19 | 12,097 | 55 | 9 | 4,977 | 41% |
| party | 147 | 57 | 10,550 | 98 | 1 | 3,892 | 37% |
| inventory | 73 | 13 | 7,009 | 70 | 11 | 5,003 | 71% |
| ordering | 43 | 12 | 4,667 | 45 | 12 | 4,230 | 91% |
| graphs | 35 | 15 | 3,007 | 46 | 12 | 3,277 | 109% |
| rules | 66 | 5 | 2,621 | 87 | 3 | 2,251 | 86% |
| planvsexecution | 63 | 9 | 3,843 | 75 | 7 | 3,390 | 88% |
| **Totals** | **583** | **183** | **64,691** | **571** | **84** | **38,519** | **60%** |

Notes: LOC = source + test lines combined. File counts exclude index/barrel files where they only re-export.

## Key Type Mapping Decisions

| Java | TypeScript | Notes |
|---|---|---|
| `BigDecimal` | `number` | Used throughout for monetary and quantity calculations. Precision tradeoff accepted. |
| `UUID` | `string` | IDs stored as plain strings, generated via `crypto.randomUUID()` |
| `Optional<T>` | `T \| null` | Null union types replace Optional; no wrapper object needed |
| `record` | `class` with `readonly` fields | TS has no record type; classes with readonly properties + explicit `equals()`/`toString()` |
| `sealed interface` | `interface` + implementing classes | No `permits` enforcement; uses discriminant properties (e.g., `entryKind: 'credited' \| 'debited'`) for narrowing |
| `LocalDateTime` / `LocalDate` | `Date` | Standard JS Date used; no temporal library |
| `List<T>` / `Set<T>` | `T[]` / `Set<T>` | Arrays replace Lists; Sets used directly |
| `Map<K,V>` | `Map<K,V>` | Direct mapping |
| `Stream` operations | Array methods / loops | `map`, `filter`, `reduce` replace stream pipelines |

## Patterns Preserved vs Adapted

### Preserved
- **OOP class structure**: Core domain classes kept as classes with encapsulated state and behavior
- **Value object pattern**: ID types (AccountId, TransactionId, etc.) remain as wrapper classes with `readonly` fields
- **Result monad**: `Result<F,S>` with `Success`/`Failure` implementations faithfully ported, including `biMap`, `flatMap`, `fold`
- **Factory methods**: Static `of()` / `generate()` constructors preserved across all value types
- **Preconditions**: `Preconditions.checkArgument()` / `checkNotNull()` guard clauses kept as-is
- **Abstract class hierarchies**: Used for Party, Address, and similar hierarchies
- **Enum types**: Java enums mapped to TypeScript `enum` where behavior-free, or union types for string literals

### Adapted
- **Java enums with methods**: Converted to classes with static instances or separate `*Ops` utility classes (e.g., `ProductTrackingStrategyOps`)
- **Method overloading**: Replaced with optional parameters, union type parameters, or separate method names
- **Package-private visibility**: No TS equivalent; everything is `export`ed or module-scoped
- **equals/hashCode**: Manually implemented as methods rather than auto-generated (no record support)
- **CompositeResult**: Uses spread operator and `Set` constructor instead of Java Streams for accumulation

## TypeScript-Specific Adaptations

- **No checked exceptions**: Java's checked exceptions become thrown `Error` instances; callers are not forced to handle them
- **No method overloading**: Handled via union parameter types, optional params, or distinct method names (e.g., `DecimalRangeConstraint.of()` vs `.between()`)
- **Module system**: ES modules with `index.ts` barrel exports replace Java packages; workspace references (`@archetypes/common`) replace Maven module dependencies
- **Discriminated unions**: `entryKind: 'credited' | 'debited'` string literal properties replace sealed interface type narrowing via `instanceof`
- **No structural hashing**: TS objects have no built-in `hashCode()`; manual implementations provided where needed (e.g., `Pair.hashCode()`)
- **Abstract utility classes**: `Preconditions`, `StringUtils`, `CollectionTransformations` use `abstract class` to prevent instantiation (mirrors Java's private-constructor utility pattern)
- **Vitest over JUnit**: Test framework swap; `describe`/`it`/`expect` replace `@Test`/`assertThat`

## Known Limitations

- **Precision loss**: `number` (IEEE 754 double) replaces `BigDecimal`. Monetary calculations may accumulate floating-point errors for values beyond ~15 significant digits. The `product` archetype uses `parseFloat()` for decimal constraints.
- **No sealed type enforcement**: TypeScript cannot restrict which classes implement an interface. The `permits` guarantee from Java sealed interfaces is lost -- any class can implement `Entry`, `ParameterValue`, etc.
- **No immutability guarantee**: `readonly` prevents reassignment but not deep mutation of objects/arrays. Java records provide stronger immutability.
- **Test coverage gap**: TypeScript has 84 test files vs Java's 183. Party archetype has only 1 test file (vs 57 in Java). Pricing has 8 (vs 28).
- **Date precision**: `Date` lacks `LocalDate` / `LocalDateTime` semantics -- no timezone-free date representation, no built-in date arithmetic.
- **No pattern matching**: Java 21 switch pattern matching over sealed types has no TS equivalent. Type narrowing requires explicit discriminant checks or `instanceof`.
- **Equality semantics**: TS lacks structural equality; `===` compares references. All value objects require explicit `.equals()` calls, which is easy to forget.
