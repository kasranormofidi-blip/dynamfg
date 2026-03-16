import { useState } from "react";
import { challenges, type Challenge } from "../challenges";
import { executeQuery } from "../api";
import { ResultsTable } from "./ResultsTable";

const diffColors = {
  beginner: "bg-green-900/50 text-green-400",
  intermediate: "bg-yellow-900/50 text-yellow-400",
  advanced: "bg-red-900/50 text-red-400",
};

export function ChallengeMode() {
  const [active, setActive] = useState<Challenge | null>(null);
  const [keyCondition, setKeyCondition] = useState("");
  const [exprValues, setExprValues] = useState("{}");
  const [indexName, setIndexName] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);

  const selectChallenge = (c: Challenge) => {
    setActive(c);
    setKeyCondition("");
    setExprValues("{}");
    setIndexName("");
    setShowHint(false);
    setShowSolution(false);
    setResult(null);
    setCorrect(null);
  };

  const submit = async () => {
    if (!active) return;
    try {
      const data = await executeQuery({
        tableName: active.tableName,
        operation: "Query",
        keyCondition,
        indexName: indexName || undefined,
        expressionValues: JSON.parse(exprValues),
      });
      setResult(data);

      // Check if they got results (simple correctness check)
      const gotResults = data.items && data.items.length > 0 && !data.error;
      setCorrect(gotResults);
    } catch {
      setCorrect(false);
      setResult({ items: [], error: "Invalid query" });
    }
  };

  const applySolution = () => {
    if (!active) return;
    setKeyCondition(active.solution.keyCondition);
    setExprValues(JSON.stringify(active.solution.expressionValues, null, 2));
    setIndexName(active.solution.indexName || "");
    setShowSolution(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">🎯 Query Challenges</h2>
        <p className="text-sm text-gray-400 mt-1">
          Test your DynamoDB skills with real manufacturing scenarios.
        </p>
      </div>

      {/* Challenge list */}
      <div className="grid gap-2">
        {challenges.map((c) => (
          <button
            key={c.id}
            onClick={() => selectChallenge(c)}
            className={`text-left px-4 py-3 rounded-lg border transition-colors ${
              active?.id === c.id
                ? "border-blue-500/50 bg-blue-600/10"
                : "border-gray-800 bg-gray-900 hover:bg-gray-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-xs px-1.5 py-0.5 rounded ${diffColors[c.difficulty]}`}>
                {c.difficulty}
              </span>
              <span className="text-sm font-medium">{c.title}</span>
              <span className="text-xs text-gray-600 ml-auto">{c.tableName}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Active challenge */}
      {active && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-medium">{active.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{active.description}</p>
            <p className="text-xs text-gray-500 mt-1">
              Table: <code className="text-gray-300">{active.tableName}</code>
            </p>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">KeyConditionExpression</label>
              <input
                value={keyCondition}
                onChange={(e) => setKeyCondition(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ExpressionAttributeValues (JSON)</label>
              <textarea
                value={exprValues}
                onChange={(e) => setExprValues(e.target.value)}
                rows={3}
                className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Index Name (leave empty for base table)</label>
              <input
                value={indexName}
                onChange={(e) => setIndexName(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={submit} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium">
              Submit
            </button>
            <button
              onClick={() => setShowHint(!showHint)}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm"
            >
              {showHint ? "Hide Hint" : "💡 Hint"}
            </button>
            <button
              onClick={applySolution}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm"
            >
              Show Solution
            </button>
          </div>

          {showHint && (
            <p className="text-sm text-yellow-400 bg-yellow-950/30 border border-yellow-900/50 rounded px-3 py-2">
              💡 {active.hint}
            </p>
          )}

          {showSolution && (
            <div className="text-xs bg-gray-950 border border-gray-800 rounded p-3 font-mono space-y-1">
              <div>KeyCondition: <span className="text-green-400">{active.solution.keyCondition}</span></div>
              <div>Values: <span className="text-green-400">{JSON.stringify(active.solution.expressionValues)}</span></div>
              {active.solution.indexName && (
                <div>Index: <span className="text-green-400">{active.solution.indexName}</span></div>
              )}
            </div>
          )}

          {correct !== null && (
            <p className={`text-sm font-medium ${correct ? "text-green-400" : "text-red-400"}`}>
              {correct ? "✅ Correct! Your query returned results." : "❌ No results — check your key condition and values."}
            </p>
          )}

          {result?.items?.length > 0 && <ResultsTable items={result.items} />}
        </div>
      )}
    </div>
  );
}
