/**
 * Ontology validation: identifier hygiene, per-kind apiName uniqueness,
 * cross-entity referential integrity, and expression syntax checks.
 * @module
 */

import { checkSyntax } from './expression.ts'
import type { EntityKind, Ontology } from './types.ts'

/** One validation finding. */
export interface ValidationIssue {
  /** Whether the finding blocks the ontology (`error`) or is advisory (`warning`). */
  severity: 'error' | 'warning'
  /** Kind of the offending entity, or `ontology` for document-level findings. */
  entityKind: EntityKind | 'ontology'
  /** `id` of the offending entity or sample instance. */
  entityId: string
  /** Display name of the offending entity. */
  entityName: string
  /** Human-readable description of the finding. */
  message: string
}

const API_NAME = /^[a-z][A-Za-z0-9]*$/

/**
 * Validate an ontology document.
 * @param o - ontology to validate.
 * @returns all issues found; an empty array means the ontology is consistent.
 */
export function validateOntology(o: Ontology): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const push = (
    severity: ValidationIssue['severity'],
    entityKind: ValidationIssue['entityKind'],
    entityId: string,
    entityName: string,
    message: string,
  ): void => {
    issues.push({ severity, entityKind, entityId, entityName, message })
  }

  const objectTypeIds = new Set(o.objectTypes.map(t => t.id))
  const valueTypeIds = new Set(o.valueTypes.map(t => t.id))
  const ruleIds = new Set(o.rules.map(r => r.id))

  const allEntities = [
    ...o.valueTypes,
    ...o.objectTypes,
    ...o.linkTypes,
    ...o.actionTypes,
    ...o.metrics,
    ...o.rules,
  ]
  const seen = new Map<string, string>()
  for (const e of allEntities) {
    if (!API_NAME.test(e.apiName)) {
      push('error', e.kind, e.id, e.displayName, `API name "${e.apiName}" must be lowerCamelCase`)
    }
    const key = `${e.kind}:${e.apiName}`
    const prior = seen.get(key)
    if (prior !== undefined) {
      push('error', e.kind, e.id, e.displayName, `API name "${e.apiName}" duplicates "${prior}"`)
    } else {
      seen.set(key, e.displayName)
    }
  }

  for (const t of o.objectTypes) {
    const propNames = new Set<string>()
    for (const p of t.properties) {
      if (!API_NAME.test(p.apiName)) {
        push('error', 'objectType', t.id, t.displayName, `property "${p.apiName}" must be lowerCamelCase`)
      }
      if (propNames.has(p.apiName)) {
        push('error', 'objectType', t.id, t.displayName, `property "${p.apiName}" is duplicated`)
      }
      propNames.add(p.apiName)
      if (p.valueTypeId !== undefined && !valueTypeIds.has(p.valueTypeId)) {
        push('error', 'objectType', t.id, t.displayName, `property "${p.apiName}" references a missing value type`)
      }
    }
    if (t.properties.length === 0) {
      push('warning', 'objectType', t.id, t.displayName, 'object type has no properties')
    } else {
      if (!propNames.has(t.primaryKey)) {
        push('error', 'objectType', t.id, t.displayName, `primary key "${t.primaryKey}" is not a defined property`)
      }
      if (!propNames.has(t.titleProperty)) {
        push('error', 'objectType', t.id, t.displayName, `title property "${t.titleProperty}" is not a defined property`)
      }
    }
  }

  for (const l of o.linkTypes) {
    if (!objectTypeIds.has(l.sourceObjectTypeId)) {
      push('error', 'linkType', l.id, l.displayName, 'source object type does not exist')
    }
    if (!objectTypeIds.has(l.targetObjectTypeId)) {
      push('error', 'linkType', l.id, l.displayName, 'target object type does not exist')
    }
  }

  for (const a of o.actionTypes) {
    for (const m of a.modifies) {
      if (!objectTypeIds.has(m.objectTypeId)) {
        push('error', 'actionType', a.id, a.displayName, 'modified object type does not exist')
      }
    }
    for (const rid of a.submissionCriteria) {
      if (!ruleIds.has(rid)) {
        push('error', 'actionType', a.id, a.displayName, 'submission criterion references a missing rule')
      }
    }
    if (a.modifies.length === 0) {
      push('warning', 'actionType', a.id, a.displayName, 'action type declares no modification targets')
    }
  }

  for (const m of o.metrics) {
    const objectType = o.objectTypes.find(t => t.id === m.objectTypeId)
    if (!objectType) {
      push('error', 'metric', m.id, m.displayName, 'aggregated object type does not exist')
    } else if (m.aggregation !== 'count') {
      const prop = objectType.properties.find(p => p.apiName === m.propertyApiName)
      if (!prop) {
        push('error', 'metric', m.id, m.displayName, `aggregated property "${m.propertyApiName ?? ''}" does not exist`)
      } else if (prop.baseType !== 'integer' && prop.baseType !== 'double') {
        push('error', 'metric', m.id, m.displayName, `aggregated property "${prop.apiName}" is not numeric`)
      }
    }
    if (m.filter !== undefined && m.filter.trim() !== '') {
      const err = checkSyntax(m.filter)
      if (err !== null) {
        push('error', 'metric', m.id, m.displayName, `invalid filter expression: ${err}`)
      }
    }
  }

  for (const r of o.rules) {
    if (!objectTypeIds.has(r.objectTypeId)) {
      push('error', 'rule', r.id, r.displayName, 'constrained object type does not exist')
    }
    const err = checkSyntax(r.expression)
    if (err !== null) {
      push('error', 'rule', r.id, r.displayName, `invalid rule expression: ${err}`)
    }
  }

  for (const s of o.sampleInstances) {
    if (!objectTypeIds.has(s.objectTypeId)) {
      push('error', 'ontology', s.id, s.id, 'sample instance references a missing object type')
    }
  }

  return issues
}
