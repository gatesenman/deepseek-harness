import { describe, expect, it } from 'vitest'
import { sampleOntology } from '../src/sample.ts'
import type { Ontology } from '../src/types.ts'
import { validateOntology } from '../src/validate.ts'

const messages = (o: Ontology): string[] => validateOntology(o).map(i => i.message)

describe('validateOntology', () => {
  it('accepts the bundled sample ontology', () => {
    expect(validateOntology(sampleOntology())).toEqual([])
  })

  it('rejects malformed and duplicate API names', () => {
    const o = sampleOntology()
    o.objectTypes[0]!.apiName = 'Bad Name'
    o.metrics[1]!.apiName = o.metrics[0]!.apiName
    const found = messages(o)
    expect(found.some(m => m.includes('must be lowerCamelCase'))).toBe(true)
    expect(found.some(m => m.includes('duplicates'))).toBe(true)
  })

  it('rejects malformed, duplicate, and dangling object properties', () => {
    const o = sampleOntology()
    const ship = o.objectTypes[0]!
    ship.properties[0]!.apiName = 'IMO number'
    ship.properties[1]!.apiName = ship.properties[2]!.apiName
    ship.properties[2]!.valueTypeId = 'vt-missing'
    const found = messages(o)
    expect(found.some(m => m.includes('must be lowerCamelCase'))).toBe(true)
    expect(found.some(m => m.includes('is duplicated'))).toBe(true)
    expect(found.some(m => m.includes('missing value type'))).toBe(true)
  })

  it('warns on empty object types and checks key properties', () => {
    const o = sampleOntology()
    o.objectTypes[0]!.properties = []
    o.objectTypes[1]!.primaryKey = 'nope'
    o.objectTypes[1]!.titleProperty = 'nope'
    const issues = validateOntology(o)
    expect(issues.some(i => i.severity === 'warning' && i.message === 'object type has no properties')).toBe(true)
    expect(issues.some(i => i.message.includes('primary key'))).toBe(true)
    expect(issues.some(i => i.message.includes('title property'))).toBe(true)
  })

  it('rejects dangling link endpoints', () => {
    const o = sampleOntology()
    o.linkTypes[0]!.sourceObjectTypeId = 'missing'
    o.linkTypes[0]!.targetObjectTypeId = 'missing'
    const found = messages(o)
    expect(found).toContain('source object type does not exist')
    expect(found).toContain('target object type does not exist')
  })

  it('rejects dangling action references and warns on no targets', () => {
    const o = sampleOntology()
    o.actionTypes[0]!.modifies = [{ objectTypeId: 'missing', operation: 'modify' }]
    o.actionTypes[0]!.submissionCriteria = ['missing-rule']
    const found = messages(o)
    expect(found).toContain('modified object type does not exist')
    expect(found).toContain('submission criterion references a missing rule')

    o.actionTypes[0]!.modifies = []
    expect(messages(o)).toContain('action type declares no modification targets')
  })

  it('rejects broken metrics', () => {
    const o = sampleOntology()
    o.metrics[0]!.objectTypeId = 'missing'
    o.metrics[1]!.propertyApiName = 'nope'
    expect(messages(o)).toContain('aggregated object type does not exist')
    expect(messages(o).some(m => m.includes('does not exist') && m.includes('nope'))).toBe(true)

    const p = sampleOntology()
    p.metrics[1]!.propertyApiName = 'shipmentId'
    expect(messages(p).some(m => m.includes('is not numeric'))).toBe(true)

    const q = sampleOntology()
    q.metrics[0]!.filter = '1 +'
    expect(messages(q).some(m => m.startsWith('invalid filter expression'))).toBe(true)

    const r = sampleOntology()
    delete r.metrics[1]!.propertyApiName
    expect(messages(r).some(m => m.includes('aggregated property ""'))).toBe(true)
  })

  it('rejects broken rules and dangling sample instances', () => {
    const o = sampleOntology()
    o.rules[0]!.objectTypeId = 'missing'
    o.rules[0]!.expression = '('
    o.sampleInstances[0]!.objectTypeId = 'missing'
    const found = messages(o)
    expect(found).toContain('constrained object type does not exist')
    expect(found.some(m => m.startsWith('invalid rule expression'))).toBe(true)
    expect(found).toContain('sample instance references a missing object type')
  })
})
