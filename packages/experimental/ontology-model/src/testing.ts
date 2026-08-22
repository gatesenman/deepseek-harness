/**
 * Ontology testing engine: runs rules and metrics against sample instances
 * and type-checks instances against their object type's property schema.
 * @module
 */

import { evaluate } from './expression.ts'
import type { BaseType, Metric, Ontology, PropertyDef, Rule, SampleInstance } from './types.ts'

/** Outcome of running one rule over its object type's sample instances. */
export interface RuleResult {
  /** `id` of the rule that ran. */
  ruleId: string
  /** Display name of the rule that ran. */
  ruleName: string
  /** Severity the rule's violations carry. */
  severity: Rule['severity']
  /** Number of instances whose expression evaluated truthy. */
  passed: number
  /** Number of instances whose expression evaluated falsy. */
  failed: number
  /** Per-instance evaluation errors (`<instanceId>: <message>`). */
  errors: string[]
  /** Instances that violated the rule. */
  failures: { instanceId: string }[]
}

/** Outcome of computing one metric over its object type's sample instances. */
export interface MetricResult {
  /** `id` of the metric that ran. */
  metricId: string
  /** Display name of the metric that ran. */
  metricName: string
  /** Aggregated value; null when no numeric values matched. */
  value: number | null
  /** Number of instances the filter matched. */
  matched: number
  /** Filter evaluation error, or null when evaluation succeeded. */
  error: string | null
}

/** Schema findings for one sample instance. */
export interface TypeCheckResult {
  /** `id` of the checked instance. */
  instanceId: string
  /** Display name of the instance's object type, or `?` when it is missing. */
  objectTypeName: string
  /** Schema problems found; empty when the instance conforms. */
  problems: string[]
}

function scopeOf(instance: SampleInstance): Record<string, unknown> {
  return { ...instance.values }
}

/**
 * Run one rule against all sample instances of its object type.
 * @param o - ontology providing instances.
 * @param rule - rule to evaluate.
 * @returns per-rule pass/fail tallies, violating instances, and evaluation errors.
 */
export function runRule(o: Ontology, rule: Rule): RuleResult {
  const result: RuleResult = {
    ruleId: rule.id,
    ruleName: rule.displayName,
    severity: rule.severity,
    passed: 0,
    failed: 0,
    errors: [],
    failures: [],
  }
  const instances = o.sampleInstances.filter(s => s.objectTypeId === rule.objectTypeId)
  for (const inst of instances) {
    try {
      if (evaluate(rule.expression, scopeOf(inst))) {
        result.passed++
      } else {
        result.failed++
        result.failures.push({ instanceId: inst.id })
      }
    } catch (e) {
      result.errors.push(`${inst.id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  return result
}

/**
 * Compute one metric over all sample instances of its object type.
 * @param o - ontology providing instances.
 * @param metric - metric to compute.
 * @returns aggregated value, matched-instance count, and any evaluation error.
 */
export function runMetric(o: Ontology, metric: Metric): MetricResult {
  const result: MetricResult = {
    metricId: metric.id,
    metricName: metric.displayName,
    value: null,
    matched: 0,
    error: null,
  }
  let instances = o.sampleInstances.filter(s => s.objectTypeId === metric.objectTypeId)
  try {
    const filter = metric.filter
    if (filter !== undefined && filter.trim() !== '') {
      instances = instances.filter(inst => Boolean(evaluate(filter, scopeOf(inst))))
    }
    result.matched = instances.length
    if (metric.aggregation === 'count') {
      result.value = instances.length
      return result
    }
    const nums = instances
      .map(inst => inst.values[metric.propertyApiName ?? ''])
      .filter((v): v is number => typeof v === 'number')
    if (nums.length === 0) {
      return result
    }
    switch (metric.aggregation) {
      case 'sum':
        result.value = nums.reduce((a, b) => a + b, 0)
        break
      case 'avg':
        result.value = nums.reduce((a, b) => a + b, 0) / nums.length
        break
      case 'min':
        result.value = Math.min(...nums)
        break
      case 'max':
        result.value = Math.max(...nums)
        break
    }
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e)
  }
  return result
}

function typeOk(value: unknown, baseType: BaseType): boolean {
  switch (baseType) {
    case 'string':
    case 'date':
    case 'timestamp':
    case 'geopoint':
      return typeof value === 'string'
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value)
    case 'double':
      return typeof value === 'number'
    case 'boolean':
      return typeof value === 'boolean'
  }
}

function checkProperty(p: PropertyDef, value: unknown, problems: string[]): void {
  if (value === undefined || value === null) {
    if (p.required) problems.push(`missing required property "${p.apiName}"`)
    return
  }
  if (p.array) {
    if (!Array.isArray(value)) {
      problems.push(`property "${p.apiName}" must be an array`)
      return
    }
    for (const item of value) {
      if (!typeOk(item, p.baseType)) {
        problems.push(`property "${p.apiName}" has an element that is not ${p.baseType}`)
        return
      }
    }
    return
  }
  if (!typeOk(value, p.baseType)) {
    problems.push(`property "${p.apiName}" is not ${p.baseType}`)
  }
}

/**
 * Type-check every sample instance against its object type's property schema.
 * @param o - ontology providing object types and instances.
 * @returns one entry per instance with its schema problems (possibly empty).
 */
export function checkInstances(o: Ontology): TypeCheckResult[] {
  return o.sampleInstances.map((inst) => {
    const objectType = o.objectTypes.find(t => t.id === inst.objectTypeId)
    const problems: string[] = []
    if (!objectType) {
      return { instanceId: inst.id, objectTypeName: '?', problems: ['object type does not exist'] }
    }
    for (const p of objectType.properties) {
      checkProperty(p, inst.values[p.apiName], problems)
    }
    for (const key of Object.keys(inst.values)) {
      if (!objectType.properties.some(p => p.apiName === key)) {
        problems.push(`unknown property "${key}"`)
      }
    }
    return { instanceId: inst.id, objectTypeName: objectType.displayName, problems }
  })
}
