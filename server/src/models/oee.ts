import { ModelDefinition } from "../types.js";

const model: ModelDefinition = {
  name: "OEE Metrics",
  description:
    "Overall Equipment Effectiveness pre-aggregated by shift and day. Demonstrates the pre-aggregation pattern — computing rollups at write time instead of query time.",
  category: "Analytics",
  table: {
    TableName: "OEEMetrics",
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
      { AttributeName: "GSI1PK", AttributeType: "S" },
      { AttributeName: "GSI1SK", AttributeType: "S" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "GSI1-ByDate",
        KeySchema: [
          { AttributeName: "GSI1PK", KeyType: "HASH" },
          { AttributeName: "GSI1SK", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  accessPatterns: [
    {
      name: "Get OEE for a machine over date range",
      description: "Daily OEE rollups for a specific machine",
      type: "Query",
      params: {
        PK: "MACHINE#line-01-station-01-machine-01",
        SK_start: "DAY#2026-03-01",
        SK_end: "DAY#2026-03-16",
      },
      keyCondition: "PK = :pk AND SK BETWEEN :start AND :end",
    },
    {
      name: "Get shift-level OEE",
      description: "OEE broken down by shift for a machine on a specific day",
      type: "Query",
      params: {
        PK: "MACHINE#line-01-station-01-machine-01",
        SK: "SHIFT#2026-03-15#",
      },
      keyCondition: "PK = :pk AND begins_with(SK, :sk)",
    },
    {
      name: "Get all machines OEE for a date",
      description: "Compare OEE across all machines for a single day via GSI",
      type: "Query",
      params: { GSI1PK: "DATE#2026-03-15" },
      keyCondition: "GSI1PK = :gsi1pk",
    },
  ],
};

export default model;
