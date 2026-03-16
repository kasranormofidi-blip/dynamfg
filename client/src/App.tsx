import { useEffect, useState } from "react";
import { fetchModels } from "./api";
import { ModelExplorer } from "./components/ModelExplorer";
import { QueryPlayground } from "./components/QueryPlayground";
import { ChallengeMode } from "./components/ChallengeMode";

import { RawDataBrowser } from "./components/RawDataBrowser";

export interface Model {
  name: string;
  description: string;
  category: string;
  tableName: string;
  keySchema: { AttributeName: string; KeyType: string }[];
  gsis?: { name: string; keySchema: { AttributeName: string; KeyType: string }[] }[];
  accessPatterns: {
    name: string;
    description: string;
    type: string;
    params: Record<string, string>;
    keyCondition: string;
    filterExpression?: string;
    indexName?: string;
  }[];
}

export default function App() {
  const [models, setModels] = useState<Model[]>([]);
  const [selected, setSelected] = useState<Model | null>(null);
  const [mode, setMode] = useState<"explore" | "challenge" | "data">("explore");

  useEffect(() => {
    fetchModels().then((data) => {
      setModels(data);
      if (data.length) setSelected(data[0]);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          🏭 DynaMFG{" "}
          <span className="text-sm font-normal text-gray-400">
            DynamoDB for Manufacturing
          </span>
        </h1>
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
          <button
            onClick={() => setMode("explore")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              mode === "explore" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setMode("challenge")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              mode === "challenge" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            🎯 Challenges
          </button>
          <button
            onClick={() => setMode("data")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              mode === "data" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            📦 Raw Data
          </button>
        </div>
      </header>

      {mode === "explore" ? (
        <div className="flex h-[calc(100vh-65px)]">
          <aside className="w-80 border-r border-gray-800 overflow-y-auto p-4">
            <ModelExplorer models={models} selected={selected} onSelect={setSelected} />
          </aside>
          <main className="flex-1 overflow-y-auto p-6">
            {selected ? (
              <QueryPlayground key={selected.tableName} model={selected} />
            ) : (
              <p className="text-gray-500">Select a model to begin.</p>
            )}
          </main>
        </div>
      ) : mode === "challenge" ? (
        <main className="max-w-4xl mx-auto p-6">
          <ChallengeMode />
        </main>
      ) : (
        <main className="max-w-6xl mx-auto p-6">
          <RawDataBrowser />
        </main>
      )}
    </div>
  );
}
