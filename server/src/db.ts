import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const isLocal = !!process.env.DYNAMODB_ENDPOINT;

const client = new DynamoDBClient(
  isLocal
    ? {
        region: "local",
        endpoint: process.env.DYNAMODB_ENDPOINT,
        credentials: { accessKeyId: "local", secretAccessKey: "local" },
      }
    : { region: process.env.AWS_REGION || "us-east-1" }
);

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export { client as rawClient, isLocal };
