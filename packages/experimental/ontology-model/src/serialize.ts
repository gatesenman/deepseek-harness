/**
 * Ontology document (de)serialization with format checking at the file
 * boundary: only formatVersion-1 JSON documents are accepted.
 * @module
 */

import { emptyOntology } from './document.ts'
import type { Ontology } from './types.ts'

const ARRAY_FIELDS = [
  'valueTypes',
  'objectTypes',
  'linkTypes',
  'actionTypes',
  'metrics',
  'rules',
  'sampleInstances',
] as const

/**
 * Parse an ontology JSON document, rejecting unknown formats.
 * @param json - raw file contents.
 * @returns the parsed ontology.
 * @throws Error when the text is not JSON, not an object, not formatVersion 1,
 * or carries a non-array entity field.
 */
export function parseOntology(json: string): Ontology {
  const raw: unknown = JSON.parse(json)
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('document must be a JSON object')
  }
  const doc = raw as Record<string, unknown>
  if (doc.formatVersion !== 1) {
    throw new Error(`unsupported formatVersion: ${String(doc.formatVersion)}`)
  }
  const base = emptyOntology(typeof doc.name === 'string' ? doc.name : 'Untitled Ontology')
  for (const field of ARRAY_FIELDS) {
    const value = doc[field]
    if (value !== undefined && !Array.isArray(value)) {
      throw new Error(`field ${field} must be an array`)
    }
    if (Array.isArray(value)) {
      ;(base[field] as unknown[]) = value
    }
  }
  return base
}

/**
 * Serialize an ontology to pretty-printed JSON.
 * @param o - ontology to serialize.
 * @returns JSON text ending in one newline.
 */
export function stringifyOntology(o: Ontology): string {
  return `${JSON.stringify(o, null, 2)}\n`
}
