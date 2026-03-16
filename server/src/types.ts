import { CreateTableCommandInput } from "@aws-sdk/client-dynamodb";

export interface ModelDefinition {
  name: string;
  description: string;
  category: string;
  table: CreateTableCommandInput;
  accessPatterns: AccessPattern[];
}

export interface AccessPattern {
  name: string;
  description: string;
  type: "Query" | "Scan" | "GetItem";
  params: Record<string, string>;
  keyCondition: string;
  filterExpression?: string;
  indexName?: string;
}
