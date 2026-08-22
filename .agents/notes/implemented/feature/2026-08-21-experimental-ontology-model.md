# Agent Note: Experimental ontology semantic-model package

Status: implemented

English | [中文](2026-08-21-experimental-ontology-model.zh.md)

## Problem

A Palantir-style ontology workbench needs a semantic model — object types with typed properties, link types, action types, value types, metrics, and rules — plus validation and a testing engine over sample instances. The harness has no owner for this domain: it is not a tool, not a capability seam over an external system, and no release group's product role covers "user-authored semantic schemas". Rule and metric-filter expressions also need evaluation, and running user-authored text through JavaScript `eval` inside the harness process is not acceptable.

## Decision

One private package, `@deepseek-ai/dsh-experimental-ontology-model`, holding the domain core as a pure in-memory library: the versioned `Ontology` document and its six entity kinds, a closed recursive-descent expression engine (literals, scope identifiers, arithmetic, comparison, boolean logic — no property access, calls, or prototype reachability), `validateOntology` for identifier hygiene and referential integrity, a testing engine (`runRule`/`runMetric`/`checkInstances`) over sample instances, an immutable editor reducer, and format-checked JSON (de)serialization that accepts only `formatVersion: 1`.

The set of entity kinds is deliberately closed at six: there is no Operation Type. Palantir's ontology models user-initiated change as action types; a separate operation concept would duplicate that role with no consumer to justify it.

The package registers no service and no tool — it exports pure functions, so any future editor Consumer (web UI plugin, tool, or SDK surface) composes it without lifecycle coupling. Its invariant companion is an explained empty: the package owns no event stream or mutable runtime data; consistency is enforced by `validateOntology` and the 100%-coverage unit suite.

## Alternatives considered

**A release-group package (e.g. `packages/core` or a new `ontology/` group).** Rejected: the public contract is entirely experimental with no stable owner or production consumer yet; `packages/experimental` exists exactly for this, and promotion is an atomic rename later.

**A Cordis service (`ctx.ontology`) now.** Rejected: a service seam needs current Consumers to design for; with none, a service would freeze an unevidenced public operation set. Pure exports keep the future seam open.

**Reusing a JavaScript expression evaluator (`eval`, `Function`, or a dependency).** Rejected: `eval`/`Function` expose the host process to user-authored text, and an expression-language dependency would import a far larger grammar than the six-operator closed grammar the domain needs; the hand-rolled parser is ~200 lines with total test coverage.

## Consequences

Consumers get a deterministic, sandboxed modeling core that is safe to run on untrusted documents. There is no editor composition yet — building the desktop/web workbench over `apps/web` is the natural next step and will decide whether a service seam is warranted. Value-type constraints (`pattern`/`min`/`max`/`enumValues`) are validated as definitions but not yet enforced on instances; that enforcement belongs to the same future step.
