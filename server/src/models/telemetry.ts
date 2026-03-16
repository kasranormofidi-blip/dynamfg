import { ModelDefinition } from "../types.js";

const TABLE_NAME = "Telemetry";

const model: ModelDefinition = {
  name: "Sensor Telemetry",
  description:
    "High-frequency sensor data using time-bucketed partition keys to avoid hot partitions. Each partition holds one hour of data per sensor.",
  category: "Time Series",
  table: {
    TableName: TABLE_NAME,
    KeySchema: [
      { AttributeName: "PK", KeyType: "HASH" },
      { AttributeName: "SK", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "PK", AttributeType: "S" },
      { AttributeName: "SK", AttributeType: "S" },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  accessPatterns: [
    {
      name: "Get readings in time range",
      description:
        "Fetch all readings for a sensor within a one-hour bucket. PK includes the hour bucket to spread writes.",
      type: "Query",
      params: {
        PK: "SENSOR#temp-01#2026-03-15T14",
        SK_start: "2026-03-15T14:00:00Z",
        SK_end: "2026-03-15T14:15:00Z",
      },
      keyCondition: "PK = :pk AND SK BETWEEN :start AND :end",
    },
    {
      name: "Get latest reading",
      description: "Get the most recent reading in the current hour bucket",
      type: "Query",
      params: { PK: "SENSOR#temp-01#2026-03-15T14" },
      keyCondition: "PK = :pk",
    },
    {
      name: "⚠️ Find all readings for a sensor (anti-pattern)",
      description:
        "Scan the entire table filtering by sensorId. Because the PK includes the hour bucket, you can't Query by sensorId alone — you'd need to know every bucket. This scan reads ALL items across ALL sensors.",
      type: "Scan",
      params: { sensorId: "line-01-station-01-machine-01-temperature" },
      keyCondition: "",
      filterExpression: "sensorId = :sid",
    },
  ],
};

export default model;
