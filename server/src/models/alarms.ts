import { ModelDefinition } from "../types.js";

const TABLE_NAME = "Alarms";

const model: ModelDefinition = {
  name: "Alarm & Event Log",
  description:
    "Alarm events with severity levels and acknowledgment tracking. GSI enables querying unacknowledged alarms across all assets.",
  category: "Events",
  table: {
    TableName: TABLE_NAME,
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
        IndexName: "GSI1",
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
      name: "Get alarms for an asset",
      description: "Fetch all alarms for a specific machine, newest first",
      type: "Query",
      params: { PK: "ASSET#machine-01" },
      keyCondition: "PK = :pk",
    },
    {
      name: "Get unacknowledged alarms by severity",
      description:
        "Find all unacknowledged CRITICAL alarms plant-wide via GSI",
      type: "Query",
      params: { GSI1PK: "UNACK#CRITICAL" },
      keyCondition: "GSI1PK = :gsi1pk",
    },
    {
      name: "Get alarms in time range",
      description: "Fetch alarms for an asset within a specific time window",
      type: "Query",
      params: {
        PK: "ASSET#machine-01",
        SK_start: "2026-03-15T00:00:00Z",
        SK_end: "2026-03-15T23:59:59Z",
      },
      keyCondition: "PK = :pk AND SK BETWEEN :start AND :end",
    },
    {
      name: "⚠️ Find all WARNING alarms (anti-pattern)",
      description:
        "Scan the entire table filtering by severity. This reads every item — expensive and slow at scale. Compare with the GSI-based approach above.",
      type: "Scan",
      params: { severity: "WARNING" },
      keyCondition: "",
      filterExpression: "severity = :sev",
    },
  ],
};

export default model;
