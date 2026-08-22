import { describe, expect, it } from 'vitest'
import { emptyOntology, sampleOntology } from '@deepseek-ai/dsh-experimental-ontology-model'
import type { EntityKind } from '@deepseek-ai/dsh-experimental-ontology-model'
import { BASE_TYPES, KIND_LABELS, newEntity } from '../src/index.ts'

const ALL_KINDS: EntityKind[] = ['valueType', 'objectType', 'linkType', 'actionType', 'metric', 'rule']

describe('editor helpers', () => {
  it('labels every entity kind', () => {
    for (const kind of ALL_KINDS) expect(KIND_LABELS[kind].length).toBeGreaterThan(0)
  })

  it('lists all primitive base types', () => {
    expect(BASE_TYPES).toContain('string')
    expect(new Set(BASE_TYPES).size).toBe(BASE_TYPES.length)
  })

  it('creates each kind with defaults referencing the first object type', () => {
    const o = sampleOntology()
    const firstId = o.objectTypes[0]?.id
    expect(firstId).toBeDefined()
    for (const kind of ALL_KINDS) {
      const e = newEntity(kind, o)
      expect(e.kind).toBe(kind)
      expect(e.id.length).toBeGreaterThan(0)
    }
    const link = newEntity('linkType', o)
    if (link.kind === 'linkType') {
      expect(link.sourceObjectTypeId).toBe(firstId)
      expect(link.targetObjectTypeId).toBe(firstId)
    }
    const metric = newEntity('metric', o)
    if (metric.kind === 'metric') expect(metric.objectTypeId).toBe(firstId)
    const rule = newEntity('rule', o)
    if (rule.kind === 'rule') expect(rule.expression).toBe('true')
    const objectType = newEntity('objectType', o)
    if (objectType.kind === 'objectType') {
      expect(objectType.primaryKey).toBe('id')
      expect(objectType.properties.map(p => p.apiName)).toContain('id')
    }
  })

  it('falls back to empty references when the ontology has no object types', () => {
    const o = emptyOntology()
    const link = newEntity('linkType', o)
    if (link.kind === 'linkType') expect(link.sourceObjectTypeId).toBe('')
    const metric = newEntity('metric', o)
    if (metric.kind === 'metric') expect(metric.objectTypeId).toBe('')
  })
})
