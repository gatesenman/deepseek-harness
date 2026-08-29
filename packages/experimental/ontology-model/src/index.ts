/**
 * Palantir-style ontology semantic model: object types with typed properties,
 * link types, action types, value types, metrics, and rules, plus a sandboxed
 * expression engine, referential validation, a testing engine over sample
 * instances, versioned JSON (de)serialization, and YAML projections (native
 * YAML plus an OSI-specification conversion). Pure library — no plugin
 * registration; the invariant companion lives at `./invariant`.
 * @module @deepseek-ai/dsh-experimental-ontology-model
 */

export type * from './types.ts'
export * from './document.ts'
export * from './expression.ts'
export * from './osi.ts'
export * from './sample.ts'
export * from './serialize.ts'
export * from './testing.ts'
export * from './validate.ts'
