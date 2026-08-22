/**
 * Pure editor helpers: entity-kind labels, the base-type list, and the
 * new-entity factory the editor shell uses. React-free so the node test lane
 * covers them.
 * @module @deepseek-ai/dsh-experimental-ontology-studio
 */
import { newId } from '@deepseek-ai/dsh-experimental-ontology-model'
import type {
  BaseType,
  EntityKind,
  Ontology,
  OntologyEntity,
} from '@deepseek-ai/dsh-experimental-ontology-model'

/**
 * Return a copy of `target` with `key` set to `value`, or with `key` removed
 * when `value` is `undefined` (required under `exactOptionalPropertyTypes`).
 * @param target - Object to copy.
 * @param key - Optional property to set or remove.
 * @param value - New value, or `undefined` to remove the property.
 * @returns A new object with the property set or absent.
 */
export function setOptional<T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: T[K] | undefined,
): T {
  const next = { ...target }
  if (value === undefined) Reflect.deleteProperty(next, key)
  else next[key] = value
  return next
}

/** Chinese display labels for each entity kind. */
export const KIND_LABELS: Record<EntityKind, string> = {
  objectType: '对象类型',
  linkType: '链接类型',
  actionType: '动作类型',
  valueType: '值类型',
  metric: '指标',
  rule: '规则',
}

/** All primitive base types, in editor display order. */
export const BASE_TYPES = [
  'string',
  'integer',
  'double',
  'boolean',
  'date',
  'timestamp',
  'geopoint',
] as const satisfies readonly BaseType[]

/**
 * Create a new entity of the given kind with editable defaults.
 * @param kind - Entity kind to create.
 * @param o - Current ontology; its first object type seeds reference fields.
 * @returns The new entity, not yet inserted into the ontology.
 */
export function newEntity(kind: EntityKind, o: Ontology): OntologyEntity {
  const base = { apiName: 'newItem', displayName: '新条目', description: '' }
  const firstObjectType = o.objectTypes[0]?.id ?? ''
  switch (kind) {
    case 'valueType':
      return { ...base, kind, id: newId('vt'), baseType: 'string' }
    case 'objectType':
      return {
        ...base,
        kind,
        id: newId('ot'),
        properties: [
          { apiName: 'id', displayName: 'ID', description: '', baseType: 'string', required: true, array: false },
        ],
        primaryKey: 'id',
        titleProperty: 'id',
      }
    case 'linkType':
      return {
        ...base,
        kind,
        id: newId('lt'),
        sourceObjectTypeId: firstObjectType,
        targetObjectTypeId: firstObjectType,
        cardinality: 'ONE_TO_MANY',
      }
    case 'actionType':
      return { ...base, kind, id: newId('at'), parameters: [], modifies: [], submissionCriteria: [] }
    case 'metric':
      return { ...base, kind, id: newId('m'), objectTypeId: firstObjectType, aggregation: 'count' }
    case 'rule':
      return {
        ...base,
        kind,
        id: newId('rule'),
        objectTypeId: firstObjectType,
        expression: 'true',
        severity: 'error',
      }
  }
}
