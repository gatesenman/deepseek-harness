/**
 * Ontology semantic-model types: six concept kinds (object types with typed
 * properties, link types, action types, value types, metrics, and rules) plus
 * sample instances and the versioned document that holds them. Types only —
 * runtime helpers live in the sibling modules.
 * @module @deepseek-ai/dsh-experimental-ontology-model
 */

/** Primitive base types an ontology value can take. */
export type BaseType =
  | 'string'
  | 'integer'
  | 'double'
  | 'boolean'
  | 'date'
  | 'timestamp'
  | 'geopoint'

/** Fields shared by every ontology entity. */
export interface EntityBase {
  /** Document-unique opaque identifier; cross-entity references use it. */
  id: string
  /** Stable machine identifier: lowerCamelCase, unique per kind. */
  apiName: string
  /** Human-readable name shown in editors and results. */
  displayName: string
  /** Free-form description of the entity's meaning. */
  description: string
}

/** Reusable, constrained semantic type over a base type. */
export interface ValueType extends EntityBase {
  /** Discriminant tag. */
  kind: 'valueType'
  /** Primitive representation the constraints apply to. */
  baseType: BaseType
  /** Regex constraint applied to string values. */
  pattern?: string
  /** Inclusive numeric lower bound. */
  min?: number
  /** Inclusive numeric upper bound. */
  max?: number
  /** Closed enumeration of allowed values. */
  enumValues?: string[]
}

/** A typed property on an object type. */
export interface PropertyDef {
  /** Stable machine identifier, unique within the owning object type. */
  apiName: string
  /** Human-readable name shown in editors and results. */
  displayName: string
  /** Free-form description of the property's meaning. */
  description: string
  /** Primitive type of the property's values. */
  baseType: BaseType
  /** When set, the property is constrained by the referenced value type. */
  valueTypeId?: string
  /** Whether instances must carry a non-null value. */
  required: boolean
  /** Whether the property holds an array of `baseType` values. */
  array: boolean
}

/** A modeled real-world entity class with typed properties. */
export interface ObjectType extends EntityBase {
  /** Discriminant tag. */
  kind: 'objectType'
  /** The typed properties instances of this object type carry. */
  properties: PropertyDef[]
  /** apiName of the property that uniquely identifies instances. */
  primaryKey: string
  /** apiName of the property used as the instance title. */
  titleProperty: string
}

/** Relationship cardinality between the source and target object types. */
export type Cardinality = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY'

/** A typed relationship between two object types. */
export interface LinkType extends EntityBase {
  /** Discriminant tag. */
  kind: 'linkType'
  /** `id` of the object type on the source side. */
  sourceObjectTypeId: string
  /** `id` of the object type on the target side. */
  targetObjectTypeId: string
  /** Relationship cardinality from source to target. */
  cardinality: Cardinality
}

/** The kind of instance modification an action performs. */
export type ModificationOp = 'create' | 'modify' | 'delete'

/** A parameter accepted by an action type. */
export interface ParameterDef {
  /** Stable machine identifier, unique within the owning action type. */
  apiName: string
  /** Human-readable name shown in editors. */
  displayName: string
  /** Primitive type of the parameter's values. */
  baseType: BaseType
  /** Whether callers must supply the parameter. */
  required: boolean
}

/** One modification target declared by an action type. */
export interface ModificationTarget {
  /** `id` of the object type the action modifies. */
  objectTypeId: string
  /** The kind of modification performed. */
  operation: ModificationOp
}

/** A user-invocable modification of object instances, guarded by rules. */
export interface ActionType extends EntityBase {
  /** Discriminant tag. */
  kind: 'actionType'
  /** Parameters the action accepts. */
  parameters: ParameterDef[]
  /** Object types the action creates, modifies, or deletes. */
  modifies: ModificationTarget[]
  /** Rule ids that must pass before the action may be submitted. */
  submissionCriteria: string[]
}

/** Aggregation applied by a metric over matched instances. */
export type Aggregation = 'count' | 'sum' | 'avg' | 'min' | 'max'

/** An aggregated measure over instances of one object type. */
export interface Metric extends EntityBase {
  /** Discriminant tag. */
  kind: 'metric'
  /** `id` of the object type whose instances are aggregated. */
  objectTypeId: string
  /** Aggregation applied to matched instances. */
  aggregation: Aggregation
  /** apiName of the numeric property aggregated over; unused for `count`. */
  propertyApiName?: string
  /** Boolean filter expression over instance properties. */
  filter?: string
}

/** Severity of a rule violation. */
export type RuleSeverity = 'error' | 'warning'

/** A boolean invariant over instances of one object type. */
export interface Rule extends EntityBase {
  /** Discriminant tag. */
  kind: 'rule'
  /** `id` of the object type the rule constrains. */
  objectTypeId: string
  /** Boolean expression over instance properties; instances failing it violate the rule. */
  expression: string
  /** Severity a violation carries. */
  severity: RuleSeverity
}

/** Union of the six ontology entity kinds. */
export type OntologyEntity =
  | ValueType
  | ObjectType
  | LinkType
  | ActionType
  | Metric
  | Rule

/** Discriminant values of {@link OntologyEntity}. */
export type EntityKind = OntologyEntity['kind']

/** A sample object instance used by the testing engine. */
export interface SampleInstance {
  /** Document-unique opaque identifier. */
  id: string
  /** `id` of the object type the instance belongs to. */
  objectTypeId: string
  /** Property values keyed by property apiName. */
  values: Record<string, unknown>
}

/** The complete versioned ontology document. */
export interface Ontology {
  /** Document format version; parsing rejects any other value. */
  formatVersion: 1
  /** Human-readable ontology name. */
  name: string
  /** All value types. */
  valueTypes: ValueType[]
  /** All object types. */
  objectTypes: ObjectType[]
  /** All link types. */
  linkTypes: LinkType[]
  /** All action types. */
  actionTypes: ActionType[]
  /** All metrics. */
  metrics: Metric[]
  /** All rules. */
  rules: Rule[]
  /** All sample instances. */
  sampleInstances: SampleInstance[]
}
