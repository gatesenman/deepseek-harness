/**
 * Bundled demo ontology: a small logistics domain exercising every concept
 * kind, used by tests and as editor seed data.
 * @module
 */

import type { Ontology } from './types.ts'

/**
 * Build the bundled logistics demo ontology.
 * @returns a fresh document (safe to mutate) with ships, shipments, a carries
 * link, a mark-delivered action, two metrics, one rule, and four sample
 * instances — one of which deliberately violates the positive-weight rule.
 */
export function sampleOntology(): Ontology {
  return {
    formatVersion: 1,
    name: 'Logistics Demo',
    valueTypes: [
      {
        kind: 'valueType',
        id: 'vt-email',
        apiName: 'email',
        displayName: 'Email address',
        description: 'Email string with a format constraint',
        baseType: 'string',
        pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$',
      },
      {
        kind: 'valueType',
        id: 'vt-weight',
        apiName: 'weightKg',
        displayName: 'Weight (kg)',
        description: 'Non-negative weight',
        baseType: 'double',
        min: 0,
      },
    ],
    objectTypes: [
      {
        kind: 'objectType',
        id: 'ot-ship',
        apiName: 'ship',
        displayName: 'Ship',
        description: 'A cargo ship in operation',
        primaryKey: 'imo',
        titleProperty: 'name',
        properties: [
          { apiName: 'imo', displayName: 'IMO number', description: '', baseType: 'string', required: true, array: false },
          { apiName: 'name', displayName: 'Ship name', description: '', baseType: 'string', required: true, array: false },
          { apiName: 'capacityKg', displayName: 'Capacity (kg)', description: '', baseType: 'double', valueTypeId: 'vt-weight', required: true, array: false },
        ],
      },
      {
        kind: 'objectType',
        id: 'ot-shipment',
        apiName: 'shipment',
        displayName: 'Shipment',
        description: 'One cargo transport',
        primaryKey: 'shipmentId',
        titleProperty: 'shipmentId',
        properties: [
          { apiName: 'shipmentId', displayName: 'Shipment id', description: '', baseType: 'string', required: true, array: false },
          { apiName: 'weightKg', displayName: 'Weight (kg)', description: '', baseType: 'double', valueTypeId: 'vt-weight', required: true, array: false },
          { apiName: 'delivered', displayName: 'Delivered', description: '', baseType: 'boolean', required: true, array: false },
        ],
      },
    ],
    linkTypes: [
      {
        kind: 'linkType',
        id: 'lt-carries',
        apiName: 'carries',
        displayName: 'Carries',
        description: 'A ship carries shipments',
        sourceObjectTypeId: 'ot-ship',
        targetObjectTypeId: 'ot-shipment',
        cardinality: 'ONE_TO_MANY',
      },
    ],
    actionTypes: [
      {
        kind: 'actionType',
        id: 'at-deliver',
        apiName: 'markDelivered',
        displayName: 'Mark delivered',
        description: 'Mark a shipment as delivered',
        parameters: [
          { apiName: 'shipmentId', displayName: 'Shipment id', baseType: 'string', required: true },
        ],
        modifies: [{ objectTypeId: 'ot-shipment', operation: 'modify' }],
        submissionCriteria: ['rule-weight'],
      },
    ],
    metrics: [
      {
        kind: 'metric',
        id: 'm-pending',
        apiName: 'pendingShipments',
        displayName: 'Pending shipments',
        description: 'Shipments not yet delivered',
        objectTypeId: 'ot-shipment',
        aggregation: 'count',
        filter: 'delivered == false',
      },
      {
        kind: 'metric',
        id: 'm-weight',
        apiName: 'totalWeight',
        displayName: 'Total weight',
        description: 'Total weight across all shipments',
        objectTypeId: 'ot-shipment',
        aggregation: 'sum',
        propertyApiName: 'weightKg',
      },
    ],
    rules: [
      {
        kind: 'rule',
        id: 'rule-weight',
        apiName: 'positiveWeight',
        displayName: 'Weight must be positive',
        description: 'A shipment weight must be greater than 0',
        objectTypeId: 'ot-shipment',
        expression: 'weightKg > 0',
        severity: 'error',
      },
    ],
    sampleInstances: [
      { id: 'inst-1', objectTypeId: 'ot-shipment', values: { shipmentId: 'S-001', weightKg: 1200.5, delivered: false } },
      { id: 'inst-2', objectTypeId: 'ot-shipment', values: { shipmentId: 'S-002', weightKg: 80, delivered: true } },
      { id: 'inst-3', objectTypeId: 'ot-shipment', values: { shipmentId: 'S-003', weightKg: 0, delivered: false } },
      { id: 'inst-4', objectTypeId: 'ot-ship', values: { imo: 'IMO-9074729', name: 'Yuanwang', capacityKg: 50000 } },
    ],
  }
}
