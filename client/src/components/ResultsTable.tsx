interface Props {
  items: Record<string, unknown>[];
}

export function ResultsTable({ items }: Props) {
  if (!items.length) {
    return <p className="text-sm text-gray-500">No items returned.</p>;
  }

  const columns = [...new Set(items.flatMap(Object.keys))];

  return (
    <div className="overflow-x-auto border border-gray-800 rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-900 text-gray-400 text-left">
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 font-medium whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr
              key={i}
              className="border-t border-gray-800 hover:bg-gray-900/50"
            >
              {columns.map((col) => (
                <td key={col} className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                  {formatValue(item[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatValue(val: unknown): string {
  if (val === undefined || val === null) return "—";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}
