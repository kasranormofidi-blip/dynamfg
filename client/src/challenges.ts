export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tableName: string;
  hint: string;
  solution: {
    keyCondition: string;
    expressionValues: Record<string, string>;
    indexName?: string;
  };
}

export const challenges: Challenge[] = [
  {
    id: "c1",
    title: "Find all children of a factory",
    description: "Get all direct children (production lines) of factory-01.",
    difficulty: "beginner",
    tableName: "AssetHierarchy",
    hint: "Children are stored with SK starting with CHILD#",
    solution: {
      keyCondition: "PK = :pk AND begins_with(SK, :sk)",
      expressionValues: { ":pk": "ASSET#factory-01", ":sk": "CHILD#" },
    },
  },
  {
    id: "c2",
    title: "Find all sensors in the plant",
    description: "Query for all assets of type Sensor using the GSI.",
    difficulty: "beginner",
    tableName: "AssetHierarchy",
    hint: "Use GSI1 where GSI1PK = TYPE#Sensor",
    solution: {
      keyCondition: "GSI1PK = :gsi1pk",
      expressionValues: { ":gsi1pk": "TYPE#Sensor" },
      indexName: "GSI1",
    },
  },
  {
    id: "c3",
    title: "Get recent telemetry",
    description: "Fetch the last 15 minutes of temperature readings for machine-01. You'll need to figure out the right time-bucketed partition key.",
    difficulty: "intermediate",
    tableName: "Telemetry",
    hint: "PK format is SENSOR#<sensorId>#<hourBucket>. The hour bucket is the ISO timestamp truncated to the hour.",
    solution: {
      keyCondition: "PK = :pk",
      expressionValues: { ":pk": "SENSOR#line-01-station-01-machine-01-temperature#2026-03-15T21" },
    },
  },
  {
    id: "c4",
    title: "Find unacknowledged critical alarms",
    description: "Find all unacknowledged CRITICAL alarms across the entire plant.",
    difficulty: "intermediate",
    tableName: "Alarms",
    hint: "Unacknowledged alarms have GSI1PK = UNACK#<severity>. This is a sparse index — acknowledged alarms don't appear.",
    solution: {
      keyCondition: "GSI1PK = :gsi1pk",
      expressionValues: { ":gsi1pk": "UNACK#CRITICAL" },
      indexName: "GSI1",
    },
  },
  {
    id: "c5",
    title: "Reverse trace a batch",
    description: "Find all input materials that went into lot-005 (forward trace is easy — reverse trace requires the GSI).",
    difficulty: "advanced",
    tableName: "BatchGenealogy",
    hint: "The GSI1 inverts the relationship. GSI1PK = LOT#<outputLot>, GSI1SK begins with INPUT#",
    solution: {
      keyCondition: "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :sk)",
      expressionValues: { ":gsi1pk": "LOT#lot-005", ":sk": "INPUT#" },
      indexName: "GSI1-Reverse",
    },
  },
  {
    id: "c6",
    title: "Compare OEE across machines",
    description: "Get the OEE for all machines on March 12, 2026 to compare performance.",
    difficulty: "intermediate",
    tableName: "OEEMetrics",
    hint: "Use the GSI1-ByDate index where GSI1PK = DATE#<date>",
    solution: {
      keyCondition: "GSI1PK = :gsi1pk",
      expressionValues: { ":gsi1pk": "DATE#2026-03-12" },
      indexName: "GSI1-ByDate",
    },
  },
  {
    id: "c7",
    title: "Find a technician's open work orders",
    description: "Get all work orders assigned to technician jsmith.",
    difficulty: "beginner",
    tableName: "WorkOrders",
    hint: "Use GSI2-Technician where GSI2PK = TECH#<login>",
    solution: {
      keyCondition: "GSI2PK = :gsi2pk",
      expressionValues: { ":gsi2pk": "TECH#jsmith" },
      indexName: "GSI2-Technician",
    },
  },
];
