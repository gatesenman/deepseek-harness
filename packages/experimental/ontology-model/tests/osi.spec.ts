import { describe, expect, it } from 'vitest'
import { emptyOntology } from '../src/document.ts'
import { stringifyOntologyYaml, toOsiYaml } from '../src/osi.ts'
import { sampleOntology } from '../src/sample.ts'
import type { LinkType, Ontology, ValueType } from '../src/types.ts'

describe('stringifyOntologyYaml', () => {
  it('renders the document structure with quoted special scalars', () => {
    const yaml = stringifyOntologyYaml(sampleOntology())
    expect(yaml).toContain('formatVersion: 1')
    expect(yaml).toContain('name: Logistics Demo')
    expect(yaml).toContain("pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'")
    expect(yaml).toContain('- kind: valueType')
    expect(yaml.endsWith('\n')).toBe(true)
  })

  it('renders empty arrays inline', () => {
    const yaml = stringifyOntologyYaml(emptyOntology('Empty'))
    expect(yaml).toContain('valueTypes: []')
    expect(yaml).toContain('sampleInstances: []')
  })

  it('quotes strings with quotes and keyword-like values', () => {
    const o = emptyOntology("It's: tricky")
    expect(stringifyOntologyYaml(o)).toContain("name: 'It''s: tricky'")
  })

  it('renders nested nulls, empty containers, and container items in instance values', () => {
    const o = emptyOntology('Weird')
    o.sampleInstances.push({
      id: 'i-1',
      objectTypeId: 'ot-x',
      values: { none: null, blank: {}, list: [[], {}, { a: 1 }] },
    })
    const yaml = stringifyOntologyYaml(o)
    expect(yaml).toContain('none: null')
    expect(yaml).toContain('blank: {}')
    expect(yaml).toContain('- []')
    expect(yaml).toContain('- {}')
    expect(yaml).toContain('- a: 1')
  })
})

describe('toOsiYaml', () => {
  it('converts the sample ontology to OSI concepts', () => {
    const yaml = toOsiYaml(sampleOntology())
    expect(yaml).toContain("version: '0.2.0.dev0'")
    expect(yaml).toContain('- concept: Email')
    expect(yaml).toContain('type: ValueType')
    expect(yaml).toContain('- Decimal')
    expect(yaml).toContain('Email matches')
    expect(yaml).toContain('WeightKg >= 0')
    expect(yaml).toContain('- concept: Ship')
    expect(yaml).toContain('type: EntityType')
    expect(yaml).toContain('- imo')
    expect(yaml).toContain('multiplicity: OneToOne')
    // property with a referenced value type targets the value concept
    expect(yaml).toContain('concept: WeightKg')
    // rule expression carried verbatim on the entity
    expect(yaml).toContain('weightKg > 0')
    // metrics become derived_by relationships
    expect(yaml).toContain('PendingShipments == COUNT[Shipment WHERE delivered == false]')
    expect(yaml).toContain('TotalWeight == SUM[Shipment.weight_kg]')
    // ONE_TO_MANY link attaches to the many (target) side pointing at the source
    expect(yaml).toContain('name: carries')
    expect(yaml).toContain('concept: Ship')
    // omitted concepts
    expect(yaml).not.toContain('markDelivered')
    expect(yaml).not.toContain('sampleInstances')
  })

  it('emits enum and max constraints and skips empty descriptions', () => {
    const o = emptyOntology('Enums')
    const status: ValueType = {
      kind: 'valueType',
      id: 'vt-status',
      apiName: 'status',
      displayName: 'Status',
      description: '',
      baseType: 'string',
      max: 9,
      enumValues: ['ACTIVE', 'INACTIVE'],
    }
    o.valueTypes.push(status)
    o.valueTypes.push({
      kind: 'valueType',
      id: 'vt-plain',
      apiName: 'plainText',
      displayName: 'Plain text',
      description: '',
      baseType: 'string',
    })
    o.objectTypes.push({
      kind: 'objectType',
      id: 'ot-bare',
      apiName: 'bare',
      displayName: 'Bare',
      description: '',
      primaryKey: 'id',
      titleProperty: 'id',
      properties: [
        { apiName: 'id', displayName: 'Id', description: '', baseType: 'string', required: true, array: false },
      ],
    })
    const yaml = toOsiYaml(o)
    expect(yaml).toContain('- concept: PlainText')
    expect(yaml).toContain('- concept: Bare')
    expect(yaml).toContain('- Status <= 9')
    expect(yaml).toContain("Status == ''ACTIVE'' OR Status == ''INACTIVE''")
    expect(yaml).not.toContain('description: Status')
  })

  it('converts ONE_TO_ONE links on the source and MANY_TO_MANY links to a join entity', () => {
    const o = sampleOntology()
    const oneToOne: LinkType = {
      kind: 'linkType',
      id: 'lt-flag',
      apiName: 'flagShipment',
      displayName: 'flags',
      description: '',
      sourceObjectTypeId: 'ot-ship',
      targetObjectTypeId: 'ot-shipment',
      cardinality: 'ONE_TO_ONE',
    }
    const manyToMany: LinkType = {
      kind: 'linkType',
      id: 'lt-visits',
      apiName: 'shipVisits',
      displayName: 'visits',
      description: '',
      sourceObjectTypeId: 'ot-ship',
      targetObjectTypeId: 'ot-shipment',
      cardinality: 'MANY_TO_MANY',
    }
    const described: LinkType = {
      kind: 'linkType',
      id: 'lt-pairs',
      apiName: 'shipPairs',
      displayName: 'pairs',
      description: 'Ship pairing table',
      sourceObjectTypeId: 'ot-ship',
      targetObjectTypeId: 'ot-shipment',
      cardinality: 'MANY_TO_MANY',
    }
    const dangling: LinkType = {
      kind: 'linkType',
      id: 'lt-dangling',
      apiName: 'dangling',
      displayName: 'dangling',
      description: '',
      sourceObjectTypeId: 'missing',
      targetObjectTypeId: 'ot-shipment',
      cardinality: 'MANY_TO_MANY',
    }
    o.linkTypes.push(oneToOne, manyToMany, described, dangling)
    const yaml = toOsiYaml(o)
    expect(yaml).toContain('name: flag_shipment')
    expect(yaml).toContain('- concept: ShipVisits')
    expect(yaml).toContain('- ship_visits_id')
    expect(yaml).toContain('{ShipVisits} links {Ship}')
    expect(yaml).toContain('{ShipVisits} links {Shipment}')
    expect(yaml).toContain('description: Ship pairing table')
    expect(yaml).not.toContain('concept: Dangling')
  })

  it('skips links with unresolved endpoints and empty ontologies emit no concepts', () => {
    const o: Ontology = emptyOntology('Empty')
    o.linkTypes.push({
      kind: 'linkType',
      id: 'lt-x',
      apiName: 'x',
      displayName: 'x',
      description: '',
      sourceObjectTypeId: 'missing',
      targetObjectTypeId: 'missing',
      cardinality: 'ONE_TO_MANY',
    })
    const yaml = toOsiYaml(o)
    expect(yaml).toContain('ontology: []')
  })
})
