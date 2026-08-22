import { describe, expect, it } from 'vitest'
import { sampleOntology } from '../src/sample.ts'
import { checkInstances, runMetric, runRule } from '../src/testing.ts'
import type { Metric, SampleInstance } from '../src/types.ts'

describe('runRule', () => {
  it('tallies passes, failures, and violating instances', () => {
    const o = sampleOntology()
    const result = runRule(o, o.rules[0]!)
    expect(result.passed).toBe(2)
    expect(result.failed).toBe(1)
    expect(result.failures).toEqual([{ instanceId: 'inst-3' }])
    expect(result.errors).toEqual([])
  })

  it('collects per-instance evaluation errors, including non-Error throws', () => {
    const o = sampleOntology()
    o.rules[0]!.expression = 'nonexistent > 0'
    expect(runRule(o, o.rules[0]!).errors.length).toBe(3)

    const p = sampleOntology()
    const values = { shipmentId: 'S-X', delivered: false }
    Object.defineProperty(values, 'weightKg', {
      enumerable: true,
      get() {
        // A string throw exercises the non-Error message path.
        throw 'getter rejected'
      },
    })
    p.sampleInstances = [{ id: 'inst-x', objectTypeId: 'ot-shipment', values }]
    expect(runRule(p, p.rules[0]!).errors).toEqual(['inst-x: getter rejected'])
  })
})

describe('runMetric', () => {
  it('counts with a filter', () => {
    const o = sampleOntology()
    const result = runMetric(o, o.metrics[0]!)
    expect(result.value).toBe(2)
    expect(result.matched).toBe(2)
    expect(result.error).toBe(null)
  })

  it('computes sum, avg, min, and max', () => {
    const o = sampleOntology()
    const base = o.metrics[1]!
    expect(runMetric(o, base).value).toBeCloseTo(1280.5)
    expect(runMetric(o, { ...base, aggregation: 'avg' }).value).toBeCloseTo(1280.5 / 3)
    expect(runMetric(o, { ...base, aggregation: 'min' }).value).toBe(0)
    expect(runMetric(o, { ...base, aggregation: 'max' }).value).toBe(1200.5)
  })

  it('returns null when no numeric values match', () => {
    const o = sampleOntology()
    const metric: Metric = { ...o.metrics[1]!, propertyApiName: 'shipmentId' }
    expect(runMetric(o, metric).value).toBe(null)
    delete metric.propertyApiName
    expect(runMetric(o, metric).value).toBe(null)
  })

  it('reports filter evaluation errors, including non-Error throws', () => {
    const o = sampleOntology()
    o.metrics[0]!.filter = 'nonexistent == true'
    expect(runMetric(o, o.metrics[0]!).error).toMatch(/unknown identifier/)

    const p = sampleOntology()
    const values = {}
    Object.defineProperty(values, 'boom', {
      enumerable: true,
      get() {
        // A string throw exercises the non-Error message path.
        throw 'getter rejected'
      },
    })
    p.sampleInstances = [{ id: 'inst-x', objectTypeId: 'ot-shipment', values }]
    p.metrics[0]!.filter = 'delivered == false'
    expect(runMetric(p, p.metrics[0]!).error).toBe('getter rejected')
  })
})

describe('checkInstances', () => {
  it('accepts conforming instances', () => {
    const results = checkInstances(sampleOntology())
    expect(results.every(r => r.problems.length === 0)).toBe(true)
  })

  it('reports missing object types, missing required values, and wrong types', () => {
    const o = sampleOntology()
    o.sampleInstances = [
      { id: 'a', objectTypeId: 'missing', values: {} },
      { id: 'b', objectTypeId: 'ot-shipment', values: { shipmentId: 'S', weightKg: 'heavy', delivered: null } },
      { id: 'c', objectTypeId: 'ot-shipment', values: { shipmentId: 'S', weightKg: 1, delivered: true, extra: 1 } },
    ]
    const [a, b, c] = checkInstances(o)
    expect(a!.objectTypeName).toBe('?')
    expect(a!.problems).toEqual(['object type does not exist'])
    expect(b!.problems).toContain('property "weightKg" is not double')
    expect(b!.problems).toContain('missing required property "delivered"')
    expect(c!.problems).toEqual(['unknown property "extra"'])
  })

  it('checks every base type and array elements', () => {
    const o = sampleOntology()
    o.objectTypes[0]!.properties = [
      { apiName: 'tags', displayName: '', description: '', baseType: 'string', required: false, array: true },
      { apiName: 'count', displayName: '', description: '', baseType: 'integer', required: false, array: false },
      { apiName: 'flag', displayName: '', description: '', baseType: 'boolean', required: false, array: false },
      { apiName: 'when', displayName: '', description: '', baseType: 'timestamp', required: false, array: false },
    ]
    const good: SampleInstance = {
      id: 'g',
      objectTypeId: 'ot-ship',
      values: { tags: ['a', 'b'], count: 2, flag: true, when: '2026-01-01T00:00:00Z' },
    }
    const bad: SampleInstance = {
      id: 'x',
      objectTypeId: 'ot-ship',
      values: { tags: 'not-array', count: 1.5, flag: 'yes', when: 7 },
    }
    const badElement: SampleInstance = { id: 'y', objectTypeId: 'ot-ship', values: { tags: ['a', 3] } }
    o.sampleInstances = [good, bad, badElement]
    const [g, x, y] = checkInstances(o)
    expect(g!.problems).toEqual([])
    expect(x!.problems).toEqual([
      'property "tags" must be an array',
      'property "count" is not integer',
      'property "flag" is not boolean',
      'property "when" is not timestamp',
    ])
    expect(y!.problems).toEqual(['property "tags" has an element that is not string'])
  })
})
