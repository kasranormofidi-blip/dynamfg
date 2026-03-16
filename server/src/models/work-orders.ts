import { ModelDefinition } from "../types.js";

const model: ModelDefinition = {
  name: "Work Orders",
  description:
    "Preventive and corrective maintenance work orders tied to assets. GSI enables querying by status across all assets and by assigned technician.",
  category: "Maintenance",
  table: {
    TableName: "WorkOrders",
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
      { AttributeName: "GSI1PK", AttributeType: "S" },
      { AttributeName: "GSI1SK", AttributeType: "S" },
      { AttributeName: "GSI2PK", AttributeType: "S" },
      { AttributeName: "GSI2SK", AttributeType: "S" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "GSI1-Status",
        KeySchema: [
          { AttributeName: "GSI1PK", KeyType: "HASH" },
          { AttributeName: "GSI1SK", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
      {
        IndexName: "GSI2-Technician",
        KeySchema: [
          { AttributeName: "GSI2PK", KeyType: "HASH" },
          { AttributeName: "GSI2SK", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  accessPatterns: [
    {
      name: "Get work orders for an asset",
      description: "All maintenance work orders for a specific machine",
      type: "Query",
      params: { PK: "ASSET#line-01-station-01-machine-01" },
      keyCondition: "PK = :pk",
    },
    {
      name: "Get open work orders plant-wide",
      description: "All work orders with OPEN status across the plant via GSI",
      type: "Query",
      params: { GSI1PK: "STATUS#OPEN" },
      keyCondition: "GSI1PK = :gsi1pk",
    },
    {
      name: "Get work orders by technician",
      description: "All work orders assigned to a specific technician",
      type: "Query",
      params: { GSI2PK: "TECH#jsmith" },
      keyCondition: "GSI2PK = :gsi2pk",
    },
    {
      name: "Get overdue preventive maintenance",
      description: "Open work orders of type PREVENTIVE due before a date",
      type: "Query",
      params: { GSI1PK: "STATUS#OPEN", GSI1SK_end: "2026-03-15" },
      keyCondition: "GSI1PK = :gsi1pk AND GSI1SK < :end",
      filterExpression: "woType = :t",
    },
  ],
};

export default model;
