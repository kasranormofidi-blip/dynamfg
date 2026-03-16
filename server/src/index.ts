import express from "express";
import cors from "cors";
import { models } from "./models/index.js";
import { docClient } from "./db.js";
import {
  QueryCommand,
  GetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const app = express();
app.use(cors());
app.use(express.json());

// List all available models
app.get("/api/models", (_req, res) => {
  res.json(
    models.map(({ name, description, category, table, accessPatterns }) => ({
      name,
      description,
      category,
      tableName: table.TableName,
      keySchema: table.KeySchema,
      gsis: table.GlobalSecondaryIndexes?.map((g) => ({
        name: g.IndexName,
        keySchema: g.KeySchema,
      })),
      accessPatterns: accessPatterns.map(({ name, description, type, params, keyCondition, filterExpression, indexName }) => ({
        name,
        description,
        type,
        params,
        keyCondition,
        filterExpression,
        indexName,
      })),
    }))
  );
});

// Execute a query against a table and return results + consumed capacity
app.post("/api/query", async (req, res) => {
  try {
    const { tableName, operation, indexName, keyCondition, filterExpression, expressionValues, scanForward = true } = req.body;

    if (operation === "GetItem") {
      const result = await docClient.send(
        new GetCommand({
          TableName: tableName,
          Key: expressionValues,
          ReturnConsumedCapacity: "TOTAL",
        })
      );
      return res.json({
        items: result.Item ? [result.Item] : [],
        count: result.Item ? 1 : 0,
        scannedCount: result.Item ? 1 : 0,
        consumedCapacity: result.ConsumedCapacity,
      });
    }

    if (operation === "Scan") {
      const result = await docClient.send(
        new ScanCommand({
          TableName: tableName,
          FilterExpression: filterExpression || undefined,
          ExpressionAttributeValues: expressionValues || undefined,
          ReturnConsumedCapacity: "TOTAL",
        })
      );
      return res.json({
        items: result.Items || [],
        count: result.Count,
        scannedCount: result.ScannedCount,
        consumedCapacity: result.ConsumedCapacity,
      });
    }

    // Default: Query
    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: indexName || undefined,
        KeyConditionExpression: keyCondition,
        FilterExpression: filterExpression || undefined,
        ExpressionAttributeValues: expressionValues,
        ScanIndexForward: scanForward,
        ReturnConsumedCapacity: "TOTAL",
      })
    );

    res.json({
      items: result.Items || [],
      count: result.Count,
      scannedCount: result.ScannedCount,
      consumedCapacity: result.ConsumedCapacity,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Scan a full table (for visualization)
app.get("/api/tables/:tableName/items", async (req, res) => {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: req.params.tableName,
        ReturnConsumedCapacity: "TOTAL",
        Limit: 500,
      })
    );
    res.json({
      items: result.Items || [],
      count: result.Count,
      consumedCapacity: result.ConsumedCapacity,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Export schema as CloudFormation
app.get("/api/models/:tableName/export/cloudformation", (req, res) => {
  const model = models.find((m) => m.table.TableName === req.params.tableName);
  if (!model) return res.status(404).json({ error: "Model not found" });

  const t = model.table;
  const cfn = {
    AWSTemplateFormatVersion: "2010-09-09",
    Description: `DynaMFG — ${model.name}: ${model.description}`,
    Resources: {
      [t.TableName!.replace(/[^a-zA-Z0-9]/g, "")]: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: t.TableName,
          KeySchema: t.KeySchema,
          AttributeDefinitions: t.AttributeDefinitions,
          BillingMode: "PAY_PER_REQUEST",
          ...(t.GlobalSecondaryIndexes && {
            GlobalSecondaryIndexes: t.GlobalSecondaryIndexes.map((g) => ({
              IndexName: g.IndexName,
              KeySchema: g.KeySchema,
              Projection: g.Projection,
            })),
          }),
        },
      },
    },
  };
  res.json(cfn);
});

// Export schema as CDK TypeScript
app.get("/api/models/:tableName/export/cdk", (req, res) => {
  const model = models.find((m) => m.table.TableName === req.params.tableName);
  if (!model) return res.status(404).json({ error: "Model not found" });

  const t = model.table;
  const pk = t.KeySchema!.find((k) => k.KeyType === "HASH")!;
  const sk = t.KeySchema!.find((k) => k.KeyType === "RANGE");

  let code = `import { Table, AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";\nimport { Construct } from "constructs";\n\n`;
  code += `// ${model.name}: ${model.description}\n`;
  code += `const table = new Table(this, "${t.TableName}", {\n`;
  code += `  tableName: "${t.TableName}",\n`;
  code += `  partitionKey: { name: "${pk.AttributeName}", type: AttributeType.STRING },\n`;
  if (sk) code += `  sortKey: { name: "${sk.AttributeName}", type: AttributeType.STRING },\n`;
  code += `  billingMode: BillingMode.PAY_PER_REQUEST,\n`;
  code += `});\n`;

  if (t.GlobalSecondaryIndexes) {
    for (const gsi of t.GlobalSecondaryIndexes) {
      const gsiPk = gsi.KeySchema!.find((k) => k.KeyType === "HASH")!;
      const gsiSk = gsi.KeySchema!.find((k) => k.KeyType === "RANGE");
      code += `\ntable.addGlobalSecondaryIndex({\n`;
      code += `  indexName: "${gsi.IndexName}",\n`;
      code += `  partitionKey: { name: "${gsiPk.AttributeName}", type: AttributeType.STRING },\n`;
      if (gsiSk) code += `  sortKey: { name: "${gsiSk.AttributeName}", type: AttributeType.STRING },\n`;
      code += `});\n`;
    }
  }

  res.type("text/plain").send(code);
});

// Partition distribution analysis
app.get("/api/tables/:tableName/partitions", async (req, res) => {
  try {
    const result = await docClient.send(
      new ScanCommand({ TableName: req.params.tableName, Limit: 500 })
    );
    const dist: Record<string, number> = {};
    for (const item of result.Items || []) {
      const pk = String(item.PK ?? Object.values(item)[0]);
      dist[pk] = (dist[pk] || 0) + 1;
    }
    const entries = Object.entries(dist)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);

    const total = entries.reduce((s, e) => s + e.count, 0);
    const max = entries[0]?.count || 0;
    const avg = total / (entries.length || 1);

    res.json({
      partitions: entries,
      stats: {
        totalItems: total,
        uniquePartitions: entries.length,
        maxItemsInPartition: max,
        avgItemsPerPartition: +avg.toFixed(1),
        hotPartitionRatio: +(max / avg).toFixed(2),
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log("🏭 DynaMFG API running on http://localhost:3001");
});
