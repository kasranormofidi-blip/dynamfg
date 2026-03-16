import { ModelDefinition } from "../types.js";

const model: ModelDefinition = {
  name: "Batch Genealogy",
  description:
    "Track materials through production stages for FDA/ISO traceability. Many-to-many relationships between input lots and output lots using composite keys.",
  category: "Traceability",
  table: {
    TableName: "BatchGenealogy",
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
        IndexName: "GSI1-Reverse",
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
      name: "Get lot details",
      description: "Fetch metadata for a specific lot/batch",
      type: "GetItem",
      params: { PK: "LOT#lot-001", SK: "META" },
      keyCondition: "PK = :pk AND SK = :sk",
    },
    {
      name: "Forward trace — what did this lot produce?",
      description: "Find all output lots that consumed a given input lot",
      type: "Query",
      params: { PK: "LOT#lot-001", SK: "OUTPUT#" },
      keyCondition: "PK = :pk AND begins_with(SK, :sk)",
    },
    {
      name: "Reverse trace — what went into this lot?",
      description: "Find all input lots that were consumed to produce this lot (via GSI)",
      type: "Query",
      params: { GSI1PK: "LOT#lot-005", GSI1SK: "INPUT#" },
      keyCondition: "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :sk)",
    },
    {
      name: "Get all lots by product",
      description: "Find all lots for a specific product SKU",
      type: "Query",
      params: { PK: "PRODUCT#widget-A" },
      keyCondition: "PK = :pk",
    },
  ],
};

export default model;
