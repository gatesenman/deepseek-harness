# @deepseek-ai/dsh-experimental-ontology-model

English | [中文](README.zh.md)

Palantir-style ontology semantic model as a pure in-memory library: six entity kinds — object types with typed properties, link types, action types, value types, metrics, and rules — plus sample instances, a sandboxed expression engine, referential validation, a testing engine, and versioned JSON (de)serialization. The [ontology model Agent Note](../../../.agents/notes/implemented/feature/2026-08-21-experimental-ontology-model.md) owns the scoping decision.

## Domain model

`src/types.ts` defines the versioned `Ontology` document. Every entity carries an opaque `id` (the cross-reference currency), a lowerCamelCase `apiName` unique per kind, a display name, and a description.

- **ObjectType** — typed `PropertyDef` list plus `primaryKey` and `titleProperty` (both apiNames of its own properties).
- **LinkType** — `sourceObjectTypeId`/`targetObjectTypeId` plus `ONE_TO_ONE`/`ONE_TO_MANY`/`MANY_TO_MANY` cardinality.
- **ActionType** — typed parameters, modification targets (`create`/`modify`/`delete` on an object type), and submission criteria referencing rule ids.
- **ValueType** — a constrained primitive (`pattern`, `min`/`max`, `enumValues`) reusable from object properties.
- **Metric** — `count`/`sum`/`avg`/`min`/`max` over one object type's instances, optionally filtered by an expression.
- **Rule** — a boolean expression instances of one object type must satisfy, with `error`/`warning` severity.

There is deliberately no Operation Type kind; action types are the only modification concept.

## Expression engine

`evaluate(src, scope)` and `checkSyntax(src)` implement a closed recursive-descent grammar: literals, scope identifiers, arithmetic, comparisons, `&&`/`||`/`!` (with `and`/`or`/`not` aliases), and parentheses. There is no property access, no function call, no prototype reachability, and no JavaScript `eval`; unknown identifiers and non-numeric operands to numeric operators throw.

## Validation and testing

`validateOntology(o)` returns `ValidationIssue`s covering apiName hygiene and per-kind uniqueness, property uniqueness and value-type references, primary-key/title-property existence, link endpoints, action targets and submission criteria, metric object/property/numeric checks, rule and filter expression syntax, and sample-instance object references. Missing action modification targets and property-less object types are warnings; everything else is an error.

The testing engine runs against `sampleInstances`: `runRule` tallies passing/failing instances and evaluation errors, `runMetric` filters then aggregates (null when no numeric values match), and `checkInstances` type-checks each instance's values against its object type's property schema (required, array, element base type, unknown keys).

## Document helpers

`emptyOntology`/`sampleOntology` construct documents (the sample is a logistics domain exercising every kind, including one instance that deliberately violates its rule). `ontologyReducer` applies editor mutations immutably; `KIND_FIELD` maps entity kinds to document fields. `parseOntology` rejects anything but a `formatVersion: 1` JSON object with array entity fields; `stringifyOntology` emits pretty-printed JSON.

## Known Limitations and Deferred Work

- **No editor composition yet** — the package is the domain core only; a desktop/web editor plugin over `apps/web` is deferred, so consumers today drive it programmatically.
- **Structural (not semantic) instance parsing** — `parseOntology` checks the envelope and array shapes only; entity-level shape errors surface later through `validateOntology`/`checkInstances`, not at parse time.
- **Value-type constraints are not enforced on instances** — `pattern`/`min`/`max`/`enumValues` are validated as definitions but `checkInstances` checks base types only.
