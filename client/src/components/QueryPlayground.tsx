import { useState } from "react";
import type { Model } from "../App";
import { executeQuery, fetchTableItems } from "../api";
import { ResultsTable } from "./ResultsTable";
import { PartitionVisualizer } from "./PartitionVisualizer";
import { SchemaExport } from "./SchemaExport";

interface Props {
  model: Model;
}

interface QueryResult {
  items: Record<string, unknown>[];
  count: number;
  scannedCount: number;
  consumedCapacity: { TableName: string; CapacityUnits: number } | null;
  error?: string;
}

export function QueryPlayground({ model }: Props) {
  const [keyCondition, setKeyCondition] = useState("");
  const [exprValues, setExprValues] = useState("{}");
  const [indexName, setIndexName] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"query" | "partitions" | "export">("query");

  const runQuery = async () => {
    setLoading(true);
    try {
      const data = await executeQuery({
        tableName: model.tableName,
        operation: "Query",
        keyCondition,
        indexName: indexName || undefined,
        expressionValues: JSON.parse(exprValues),
      });
      setResult(data);
    } catch (e: any) {
      setResult({ items: [], count: 0, scannedCount: 0, consumedCapacity: null, error: e.message });
    }
    setLoading(false);
  };

  const scanTable = async () => {
    setLoading(true);
    const data = await fetchTableItems(model.tableName);
    setResult({ ...data, consumedCapacity: data.consumedCapacity });
    setLoading(false);
  };

  const fillFromPattern = (ap: Model["accessPatterns"][0]) => {
    setTab("query");
    setKeyCondition(ap.keyCondition);
    setIndexName(ap.indexName || "");
    // Convert params to expression attribute values with : prefix
    const values: Record<string, string> = {};
    for (const [k, v] of Object.entries(ap.params)) {
      values[`:${k.replace(/^:/, "")}`] = v;
    }
    setExprValues(JSON.stringify(values, null, 2));
  };

  const tabs = [
    { id: "query" as const, label: "Query" },
    { id: "partitions" as const, label: "Partitions" },
    { id: "export" as const, label: "Export" },
  ];

  return (
    <div className="space-y-6">
      {/* Model info */}
      <div>
        <h2 className="text-lg font-bold">{model.name}</h2>
        <p className="text-sm text-gray-400 mt-1">{model.description}</p>
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
          <span>
            Table: <code className="text-gray-300">{model.tableName}</code>
          </span>
          <span>
            Keys:{" "}
            {model.keySchema.map((k) => (
              <code key={k.AttributeName} className="text-gray-300 mr-1">
                {k.AttributeName}({k.KeyType})
              </code>
            ))}
          </span>
          {model.gsis?.map((g) => (
            <span key={g.name}>
              {g.name}:{" "}
              {g.keySchema.map((k) => (
                <code key={k.AttributeName} className="text-gray-300 mr-1">
                  {k.AttributeName}({k.KeyType})
                </code>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Access patterns */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-2">
          Access Patterns
          <span className="text-xs font-normal text-gray-600 ml-2">click to auto-fill query</span>
        </h3>
        <div className="grid gap-2">
          {model.accessPatterns.map((ap) => (
            <button
              key={ap.name}
              onClick={() => fillFromPattern(ap)}
              className="text-left bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 hover:border-gray-600 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                    ap.type === "Query"
                      ? "bg-green-900/50 text-green-400"
                      : ap.type === "Scan"
                        ? "bg-red-900/50 text-red-400"
                        : "bg-blue-900/50 text-blue-400"
                  }`}
                >
                  {ap.type}
                </span>
                <span className="text-sm font-medium">{ap.name}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{ap.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm transition-colors ${
              tab === t.id
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "query" && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-400">Query Editor</h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">KeyConditionExpression</label>
              <input
                value={keyCondition}
                onChange={(e) => setKeyCondition(e.target.value)}
                placeholder='PK = :pk AND begins_with(SK, :sk)'
                className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ExpressionAttributeValues (JSON)</label>
              <textarea
                value={exprValues}
                onChange={(e) => setExprValues(e.target.value)}
                rows={3}
                placeholder='{":pk": "ASSET#factory-01", ":sk": "CHILD#"}'
                className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Index Name (leave empty for base table)</label>
              <input
                value={indexName}
                onChange={(e) => setIndexName(e.target.value)}
                placeholder="GSI1"
                className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={runQuery}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded text-sm font-medium"
              >
                Run Query
              </button>
              <button
                onClick={scanTable}
                disabled={loading}
                className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-4 py-2 rounded text-sm"
              >
                Scan Table
              </button>
            </div>
          </div>

          {result && (
            <div className="space-y-3">
              <div className="flex gap-4 text-sm">
                <span className="text-gray-400">
                  Items returned: <span className="text-white font-medium">{result.count}</span>
                </span>
                <span className="text-gray-400">
                  Items scanned:{" "}
                  <span className={`font-medium ${result.scannedCount > result.count ? "text-yellow-400" : "text-white"}`}>
                    {result.scannedCount}
                  </span>
                </span>
                {result.consumedCapacity && (
                  <span className="text-gray-400">
                    Consumed RCUs: <span className="text-white font-medium">{result.consumedCapacity.CapacityUnits}</span>
                  </span>
                )}
              </div>
              {result.scannedCount > result.count && (
                <p className="text-xs text-yellow-500">
                  ⚠️ Scanned more items than returned — a filter is doing work that a better key design could avoid.
                </p>
              )}
              {result.error && <p className="text-sm text-red-400">Error: {result.error}</p>}
              <ResultsTable items={result.items} />
            </div>
          )}
        </div>
      )}

      {tab === "partitions" && <PartitionVisualizer tableName={model.tableName} />}
      {tab === "export" && <SchemaExport tableName={model.tableName} />}
    </div>
  );
}
