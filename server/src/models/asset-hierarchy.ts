import { ModelDefinition } from "../types.js";

const TABLE_NAME = "AssetHierarchy";

const model: ModelDefinition = {
  name: "Asset Hierarchy",
  description:
    "ISA-95 asset tree using the adjacency list pattern. Models Factory → Line → Station → Machine → Sensor relationships in a single table.",
  category: "Asset Management",
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
      name: "Get asset details",
      description: "Fetch a single asset by its ID",
      type: "GetItem",
      params: { PK: "ASSET#machine-01", SK: "META" },
      keyCondition: "PK = :pk AND SK = :sk",
    },
    {
      name: "Get children of an asset",
      description:
        "List all direct children of a parent asset (e.g., all machines on a line)",
      type: "Query",
      params: { PK: "ASSET#line-01", SK: "CHILD#" },
      keyCondition: "PK = :pk AND begins_with(SK, :sk)",
    },
    {
      name: "Get all assets by type",
      description: "Find all assets of a given type (e.g., all Sensors) via GSI",
      type: "Query",
      params: { GSI1PK: "TYPE#Sensor", GSI1SK: "" },
      keyCondition: "GSI1PK = :gsi1pk",
    },
  ],
};

export default model;
