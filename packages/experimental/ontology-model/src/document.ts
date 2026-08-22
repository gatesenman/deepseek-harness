/**
 * Ontology document helpers: the empty document, the kind-to-field mapping,
 * a pure reducer for editor mutations, and id generation.
 * @module
 */

import type { EntityKind, Ontology, OntologyEntity, SampleInstance } from './types.ts'

/**
 * Create an empty ontology document.
 * @param name - human-readable ontology name.
 * @returns a fresh formatVersion-1 document with every entity list empty.
 */
export function emptyOntology(name = 'Untitled Ontology'): Ontology {
  return {
    formatVersion: 1,
    name,
    valueTypes: [],
    objectTypes: [],
    linkTypes: [],
    actionTypes: [],
    metrics: [],
    rules: [],
    sampleInstances: [],
  }
}

/** Maps each entity kind to its array field on the ontology document. */
export const KIND_FIELD = {
  valueType: 'valueTypes',
  objectType: 'objectTypes',
  linkType: 'linkTypes',
  actionType: 'actionTypes',
  metric: 'metrics',
  rule: 'rules',
} as const satisfies Record<EntityKind, keyof Ontology>

/** Editor mutations {@link ontologyReducer} applies. */
export type OntologyAction =
  | { type: 'set'; ontology: Ontology }
  | { type: 'rename'; name: string }
  | { type: 'upsert'; entity: OntologyEntity }
  | { type: 'remove'; kind: EntityKind; id: string }
  | { type: 'upsertInstance'; instance: SampleInstance }
  | { type: 'removeInstance'; id: string }

/**
 * Apply one action to the ontology document.
 * @param state - current ontology.
 * @param action - mutation to apply.
 * @returns the next ontology; the input document and its lists are never mutated.
 */
export function ontologyReducer(state: Ontology, action: OntologyAction): Ontology {
  switch (action.type) {
    case 'set':
      return action.ontology
    case 'rename':
      return { ...state, name: action.name }
    case 'upsert': {
      const field = KIND_FIELD[action.entity.kind]
      const list = state[field] as OntologyEntity[]
      const idx = list.findIndex(e => e.id === action.entity.id)
      const next = idx === -1 ? [...list, action.entity] : list.with(idx, action.entity)
      return { ...state, [field]: next }
    }
    case 'remove': {
      const field = KIND_FIELD[action.kind]
      const list = state[field] as OntologyEntity[]
      return { ...state, [field]: list.filter(e => e.id !== action.id) }
    }
    case 'upsertInstance': {
      const idx = state.sampleInstances.findIndex(s => s.id === action.instance.id)
      const next = idx === -1
        ? [...state.sampleInstances, action.instance]
        : state.sampleInstances.with(idx, action.instance)
      return { ...state, sampleInstances: next }
    }
    case 'removeInstance':
      return {
        ...state,
        sampleInstances: state.sampleInstances.filter(s => s.id !== action.id),
      }
  }
}

let counter = 0

/**
 * Generate a document-unique entity id.
 * @param prefix - short kind prefix (e.g. `ot`).
 * @returns an id unique within the process (timestamp plus a process-wide counter).
 */
export function newId(prefix: string): string {
  counter++
  return `${prefix}-${Date.now().toString(36)}-${counter}`
}
