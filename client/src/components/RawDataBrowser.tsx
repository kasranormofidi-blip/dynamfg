import { useEffect, useState } from "react";
import { fetchModels, fetchTableItems } from "../api";
import { ResultsTable } from "./ResultsTable";

interface TableData {
  tableName: string;
  items: Record<string, unknown>[];
  count: number;
}

export function RawDataBrowser() {
  const [tables, setTables] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [data, setData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchModels().then((models: { tableName: string }[]) => {
      const names = models.map((m) => m.tableName);
      setTables(names);
      if (names.length) {
        setSelected(names[0]);
        loadTable(names[0]);
      }
    });
  }, []);

  const loadTable = async (name: string) => {
    setLoading(true);
    const res = await fetchTableItems(name);
    setData({ tableName: name, items: res.items || [], count: res.count || 0 });
    setLoading(false);
  };

  const selectTable = (name: string) => {
    setSelected(name);
    loadTable(name);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">📦 Raw Data Browser</h2>
        <p className="text-sm text-gray-400 mt-1">
          Browse all items in every table. See how single-table design looks in practice.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tables.map((t) => (
          <button
            key={t}
            onClick={() => selectTable(t)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              selected === t
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      {data && !loading && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            <span className="text-white font-medium">{data.count}</span> items in{" "}
            <code className="text-gray-300">{data.tableName}</code>
          </p>
          <ResultsTable items={data.items} />
        </div>
      )}
    </div>
  );
}
