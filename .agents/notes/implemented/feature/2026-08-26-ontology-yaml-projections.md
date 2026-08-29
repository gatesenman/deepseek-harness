# Agent Note: Ontology YAML projections (native + OSI)

Status: implemented

English | [中文](2026-08-26-ontology-yaml-projections.zh.md)

## Problem

The ontology model persisted only as `formatVersion: 1` JSON. The product workflow models with the Palantir-style six kinds and then hands the finished design to OSI tooling, which consumes a different YAML schema (`ValueType`/`EntityType` concepts, snake_case relationships, `identify_by`, `OneToOne`/`ManyToOne` multiplicity only). There was no YAML rendering of the native document and no conversion to that schema.

## Decision

`packages/experimental/ontology-model/src/osi.ts` adds two projections over the unchanged six-kind document. `stringifyOntologyYaml` renders the document as YAML with identical structure and field names through a small block emitter scoped to the JSON-value subset (no YAML dependency: the emitter is ~40 lines against a closed value set, and the model package stays dependency-free). `toOsiYaml` converts deterministically: value types → `ValueType` concepts (`extends` on the mapped base type; pattern/min/max/enum as `requires` expressions); object types → `EntityType` concepts whose properties become relationships toward their value concept, with the primary-key relationship `OneToOne` and named in `identify_by`; link types → a relationship on the many side (`ONE_TO_MANY` attaches to the target), and `MANY_TO_MANY` → a join `EntityType` with a synthesized `<link>_id` identity relationship plus one `ManyToOne` relationship per end; metrics → `derived_by` relationships (`COUNT`/`SUM`/`AVG`/`MIN`/`MAX`, `WHERE` for filters); rules → verbatim entity-level `requires`. Action types and sample instances have no OSI counterpart and are omitted.

The studio topbar splits export into three actions — native JSON (`stringifyOntology`), native YAML (`stringifyOntologyYaml`, `ontology.yaml`), and OSI YAML (`toOsiYaml`, `ontology.osi.yaml`) — through the widened `exportFile(text, filename, mime)` bridge.

## Alternatives considered

**Depending on the `yaml` package for serialization.** Rejected: the model package is a dependency-free in-memory library inlined into the browser bundle; the closed value set makes a maintained YAML emitter net-negative here (dependency plumbing across the client bundle for ~40 owned lines).

**Emitting `OneToMany`/`ManyToMany` multiplicities.** Rejected: the OSI schema defines only `OneToOne` and `ManyToOne`; the conversion re-anchors relationships on the many side instead.

## Consequences

One modeled ontology yields two YAML documents: a lossless native rendering and an OSI projection. The OSI output preserves rule/filter expressions verbatim, so consumers using a different expression grammar must translate them. Parsing YAML back into the model remains unimplemented; the native import path is still JSON-only.
