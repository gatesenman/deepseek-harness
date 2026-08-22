import { describe, expect, it } from 'vitest'
import { KIND_FIELD, emptyOntology, newId, ontologyReducer } from '../src/document.ts'
import { sampleOntology } from '../src/sample.ts'
import { parseOntology, stringifyOntology } from '../src/serialize.ts'
import type { ObjectType, SampleInstance } from '../src/types.ts'

describe('ontologyReducer', () => {
  it('sets and renames the document', () => {
    const o = emptyOntology()
    const replaced = ontologyReducer(o, { type: 'set', ontology: sampleOntology() })
    expect(replaced.name).toBe('Logistics Demo')
    expect(ontologyReducer(o, { type: 'rename', name: 'X' }).name).toBe('X')
  })

  it('upserts and removes entities without mutating the input', () => {
    const o = sampleOntology()
    const entity: ObjectType = {
      kind: 'objectType',
      id: newId('ot'),
      apiName: 'port',
      displayName: 'Port',
      description: '',
      primaryKey: 'code',
      titleProperty: 'code',
      properties: [
        { apiName: 'code', displayName: '', description: '', baseType: 'string', required: true, array: false },
      ],
    }
    const added = ontologyReducer(o, { type: 'upsert', entity })
    expect(added.objectTypes.length).toBe(o.objectTypes.length + 1)
    expect(o.objectTypes.some(t => t.id === entity.id)).toBe(false)

    const renamed = ontologyReducer(added, { type: 'upsert', entity: { ...entity, displayName: 'Harbor' } })
    expect(renamed.objectTypes.find(t => t.id === entity.id)!.displayName).toBe('Harbor')
    expect(renamed.objectTypes.length).toBe(added.objectTypes.length)

    const removed = ontologyReducer(renamed, { type: 'remove', kind: 'objectType', id: entity.id })
    expect(removed.objectTypes.some(t => t.id === entity.id)).toBe(false)
  })

  it('manages sample instances', () => {
    const o = sampleOntology()
    const instance: SampleInstance = { id: 'inst-new', objectTypeId: 'ot-ship', values: {} }
    const added = ontologyReducer(o, { type: 'upsertInstance', instance })
    expect(added.sampleInstances.some(s => s.id === 'inst-new')).toBe(true)

    const updated = ontologyReducer(added, {
      type: 'upsertInstance',
      instance: { ...instance, values: { imo: 'X' } },
    })
    expect(updated.sampleInstances.find(s => s.id === 'inst-new')!.values).toEqual({ imo: 'X' })
    expect(updated.sampleInstances.length).toBe(added.sampleInstances.length)

    const removed = ontologyReducer(updated, { type: 'removeInstance', id: 'inst-new' })
    expect(removed.sampleInstances.some(s => s.id === 'inst-new')).toBe(false)
  })
})

describe('newId', () => {
  it('generates distinct prefixed ids', () => {
    const a = newId('ot')
    const b = newId('ot')
    expect(a).toMatch(/^ot-/)
    expect(a).not.toBe(b)
  })
})

describe('KIND_FIELD', () => {
  it('maps every entity kind onto an empty-document list', () => {
    const o = emptyOntology('N')
    for (const field of Object.values(KIND_FIELD)) {
      expect(Array.isArray(o[field])).toBe(true)
    }
  })
})

describe('serialization', () => {
  it('round-trips the sample ontology', () => {
    const o = sampleOntology()
    expect(parseOntology(stringifyOntology(o))).toEqual(o)
  })

  it('defaults the name and missing lists', () => {
    const parsed = parseOntology('{"formatVersion": 1}')
    expect(parsed.name).toBe('Untitled Ontology')
    expect(parsed.objectTypes).toEqual([])
  })

  it('rejects non-objects, unsupported versions, and non-array fields', () => {
    expect(() => parseOntology('null')).toThrow(/JSON object/)
    expect(() => parseOntology('"str"')).toThrow(/JSON object/)
    expect(() => parseOntology('{"formatVersion": 2}')).toThrow(/unsupported formatVersion: 2/)
    expect(() => parseOntology('{"formatVersion": 1, "rules": {}}')).toThrow(/field rules must be an array/)
  })
})
