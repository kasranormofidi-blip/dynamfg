import type { Model } from "../App";

interface Props {
  models: Model[];
  selected: Model | null;
  onSelect: (m: Model) => void;
}

export function ModelExplorer({ models, selected, onSelect }: Props) {
  const grouped = models.reduce<Record<string, Model[]>>((acc, m) => {
    (acc[m.category] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Data Models
      </h2>
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-xs text-gray-500 mb-1">{category}</h3>
          {items.map((m) => (
            <button
              key={m.tableName}
              onClick={() => onSelect(m)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                selected?.tableName === m.tableName
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "hover:bg-gray-800 text-gray-300"
              }`}
            >
              <div className="font-medium text-sm">{m.name}</div>
              <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                {m.description}
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
