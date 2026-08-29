/**
 * YAML projections of the ontology document: a lossless YAML rendering of the
 * six-kind Palantir-style model, and a deterministic conversion to an Apache
 * Ossie (OSI) ontology YAML. Action types and sample instances have no OSI
 * counterpart and are omitted from the OSI projection.
 * @module
 */

import type {
  Aggregation,
  BaseType,
  LinkType,
  Metric,
  ObjectType,
  Ontology,
  PropertyDef,
  ValueType,
} from './types.ts'

/** YAML value subset the emitters produce. */
type YamlValue =
  | string
  | number
  | boolean
  | null
  | YamlValue[]
  | { [key: string]: YamlValue | undefined }

/** Containers the block emitter recurses into. */
type YamlContainer = YamlValue[] | { [key: string]: YamlValue | undefined }

const NEEDS_QUOTE = /[:#&*?|>{}[\],'"%@`!\n]|^[\s-]|[\s]$|^$|^(?:true|false|null|~|yes|no|on|off)$|^[-+.\d]/i

function scalar(v: string | number | boolean | null): string {
  if (v === null) return 'null'
  if (typeof v !== 'string') return String(v)
  if (!NEEDS_QUOTE.test(v)) return v
  return `'${v.replaceAll("'", "''")}'`
}

function isContainer(v: YamlValue): v is YamlContainer {
  return typeof v === 'object' && v !== null
}

function isEmpty(v: YamlContainer): boolean {
  return Array.isArray(v) ? v.length === 0 : Object.keys(v).length === 0
}

function emit(value: YamlContainer, indent: number): string[] {
  const pad = '  '.repeat(indent)
  if (Array.isArray(value)) {
    if (value.length === 0) return [`${pad}[]`]
    return value.flatMap((item) => {
      if (isContainer(item)) {
        return emit(item, indent + 1).map(
          (line, i) => (i === 0 ? `${pad}- ${line.trimStart()}` : line),
        )
      }
      return [`${pad}- ${scalar(item)}`]
    })
  }
  const entries = Object.entries(value).filter(
    (e): e is [string, YamlValue] => e[1] !== undefined,
  )
  if (entries.length === 0) return [`${pad}{}`]
  return entries.flatMap(([key, v]) => {
    if (isContainer(v)) {
      if (isEmpty(v)) return [`${pad}${key}: ${Array.isArray(v) ? '[]' : '{}'}`]
      return [`${pad}${key}:`, ...emit(v, indent + 1)]
    }
    return [`${pad}${key}: ${scalar(v)}`]
  })
}

/**
 * Render a YAML document from the emitter's value subset.
 * @param value - document root.
 * @returns YAML text ending in one newline.
 */
function toYamlDocument(value: YamlContainer): string {
  return `${emit(value, 0).join('\n')}\n`
}

/**
 * Serialize an ontology to YAML with the same structure and field names as the
 * JSON document format; a YAML parse of the output round-trips through
 * `parseOntology` after JSON re-encoding.
 * @param o - ontology to serialize.
 * @returns YAML text ending in one newline.
 */
export function stringifyOntologyYaml(o: Ontology): string {
  return toYamlDocument(JSON.parse(JSON.stringify(o)) as YamlContainer)
}

/** Map from ontology base types to OSI base type names. */
const OSI_BASE: Record<BaseType, string> = {
  string: 'String',
  integer: 'Integer',
  double: 'Decimal',
  boolean: 'Boolean',
  date: 'Date',
  timestamp: 'DateTime',
  geopoint: 'String',
}

/** Map from metric aggregations to OSI aggregate function names. */
const OSI_AGGREGATE: Record<Aggregation, string> = {
  count: 'COUNT',
  sum: 'SUM',
  avg: 'AVG',
  min: 'MIN',
  max: 'MAX',
}

function pascalCase(name: string): string {
  return name
    .split(/[^A-Za-z0-9]+|(?=[A-Z])/)
    .filter(s => s.length > 0)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

function snakeCase(name: string): string {
  return name
    .split(/[^A-Za-z0-9]+|(?=[A-Z])/)
    .filter(s => s.length > 0)
    .map(s => s.toLowerCase())
    .join('_')
}

function valueTypeRequires(v: ValueType): string[] {
  const name = pascalCase(v.apiName)
  const requires: string[] = []
  if (v.pattern !== undefined) requires.push(`${name} matches '${v.pattern}'`)
  if (v.min !== undefined) requires.push(`${name} >= ${String(v.min)}`)
  if (v.max !== undefined) requires.push(`${name} <= ${String(v.max)}`)
  if (v.enumValues !== undefined && v.enumValues.length > 0) {
    requires.push(v.enumValues.map(e => `${name} == '${e}'`).join(' OR '))
  }
  return requires
}

interface OsiRelationship {
  name: string
  verbalizes: string[]
  multiplicity: 'OneToOne' | 'ManyToOne'
  derived_by?: string[] | undefined
  roles: { concept: string }[]
}

interface OsiConcept {
  concept: string
  description?: string | undefined
  type: 'ValueType' | 'EntityType'
  extends?: string[] | undefined
  requires?: string[] | undefined
  identify_by?: string[] | undefined
  relationships?: OsiRelationship[] | undefined
}

function propertyConcept(p: PropertyDef, byId: Map<string, ValueType>): string {
  const ref = p.valueTypeId === undefined ? undefined : byId.get(p.valueTypeId)
  return ref === undefined ? OSI_BASE[p.baseType] : pascalCase(ref.apiName)
}

function propertyRelationship(
  o: ObjectType,
  p: PropertyDef,
  byId: Map<string, ValueType>,
): OsiRelationship {
  return {
    name: snakeCase(p.apiName),
    verbalizes: [`{${pascalCase(o.apiName)}} has ${p.displayName}`],
    multiplicity: p.apiName === o.primaryKey ? 'OneToOne' : 'ManyToOne',
    roles: [{ concept: propertyConcept(p, byId) }],
  }
}

function metricRelationship(m: Metric, entity: ObjectType): OsiRelationship {
  const aggregate = OSI_AGGREGATE[m.aggregation]
  const subject =
    m.propertyApiName === undefined
      ? pascalCase(entity.apiName)
      : `${pascalCase(entity.apiName)}.${snakeCase(m.propertyApiName)}`
  const where = m.filter === undefined ? '' : ` WHERE ${m.filter}`
  return {
    name: snakeCase(m.apiName),
    verbalizes: [`{${pascalCase(entity.apiName)}} measures ${m.displayName}`],
    multiplicity: 'ManyToOne',
    derived_by: [`${pascalCase(m.apiName)} == ${aggregate}[${subject}${where}]`],
    roles: [{ concept: m.aggregation === 'count' ? 'Integer' : 'Decimal' }],
  }
}

function linkRelationship(l: LinkType, subject: ObjectType, target: ObjectType): OsiRelationship {
  return {
    name: snakeCase(l.apiName),
    verbalizes: [`{${pascalCase(subject.apiName)}} ${l.displayName} {${pascalCase(target.apiName)}}`],
    multiplicity: l.cardinality === 'ONE_TO_ONE' ? 'OneToOne' : 'ManyToOne',
    roles: [{ concept: pascalCase(target.apiName) }],
  }
}

/**
 * Convert an ontology to OSI-specification ontology YAML.
 *
 * Deterministic projection: value types become OSI `ValueType` concepts with
 * `extends` on the mapped base type and numeric/enum constraints as
 * `requires`; object types become `EntityType` concepts whose properties are
 * relationships to their value concept (the primary-key relationship is
 * `OneToOne` and named in `identify_by`); link types become a relationship on
 * the many side (`ONE_TO_MANY` attaches to the target, otherwise the source);
 * `MANY_TO_MANY` links become a join `EntityType` with a `ManyToOne`
 * relationship to each end; metrics become `derived_by` relationships; rule
 * expressions are carried verbatim as `requires` on their entity. Action
 * types and sample instances are omitted.
 * @param o - ontology to convert.
 * @returns OSI YAML text ending in one newline.
 */
export function toOsiYaml(o: Ontology): string {
  const valueTypesById = new Map(o.valueTypes.map(v => [v.id, v]))
  const objectTypesById = new Map(o.objectTypes.map(t => [t.id, t]))
  const concepts: OsiConcept[] = []
  for (const v of o.valueTypes) {
    const requires = valueTypeRequires(v)
    concepts.push({
      concept: pascalCase(v.apiName),
      description: v.description === '' ? undefined : v.description,
      type: 'ValueType',
      extends: [OSI_BASE[v.baseType]],
      requires: requires.length === 0 ? undefined : requires,
    })
  }
  for (const t of o.objectTypes) {
    const relationships = t.properties.map(p => propertyRelationship(t, p, valueTypesById))
    for (const m of o.metrics) {
      if (m.objectTypeId === t.id) relationships.push(metricRelationship(m, t))
    }
    for (const l of o.linkTypes) {
      const source = objectTypesById.get(l.sourceObjectTypeId)
      const target = objectTypesById.get(l.targetObjectTypeId)
      if (source === undefined || target === undefined || l.cardinality === 'MANY_TO_MANY') continue
      if (l.cardinality === 'ONE_TO_MANY' && target.id === t.id) {
        relationships.push(linkRelationship(l, target, source))
      } else if (l.cardinality === 'ONE_TO_ONE' && source.id === t.id) {
        relationships.push(linkRelationship(l, source, target))
      }
    }
    const requires = o.rules.filter(r => r.objectTypeId === t.id).map(r => r.expression)
    concepts.push({
      concept: pascalCase(t.apiName),
      description: t.description === '' ? undefined : t.description,
      type: 'EntityType',
      identify_by: [snakeCase(t.primaryKey)],
      requires: requires.length === 0 ? undefined : requires,
      relationships,
    })
  }
  for (const l of o.linkTypes) {
    if (l.cardinality !== 'MANY_TO_MANY') continue
    const source = objectTypesById.get(l.sourceObjectTypeId)
    const target = objectTypesById.get(l.targetObjectTypeId)
    if (source === undefined || target === undefined) continue
    const joinName = pascalCase(l.apiName)
    const idRelation = `${snakeCase(l.apiName)}_id`
    concepts.push({
      concept: joinName,
      description: l.description === '' ? undefined : l.description,
      type: 'EntityType',
      identify_by: [idRelation],
      relationships: [
        {
          name: idRelation,
          verbalizes: [`{${joinName}} is identified by ${idRelation}`],
          multiplicity: 'OneToOne',
          roles: [{ concept: 'String' }],
        },
        {
          name: snakeCase(source.apiName),
          verbalizes: [`{${joinName}} links {${pascalCase(source.apiName)}}`],
          multiplicity: 'ManyToOne',
          roles: [{ concept: pascalCase(source.apiName) }],
        },
        {
          name: snakeCase(target.apiName),
          verbalizes: [`{${joinName}} links {${pascalCase(target.apiName)}}`],
          multiplicity: 'ManyToOne',
          roles: [{ concept: pascalCase(target.apiName) }],
        },
      ],
    })
  }
  return toYamlDocument({
    version: '0.2.0.dev0',
    name: o.name,
    description: `Converted from the ${o.name} ontology document (formatVersion 1).`,
    ontology: concepts as unknown as YamlValue[],
  })
}
