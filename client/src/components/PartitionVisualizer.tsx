import { useEffect, useState } from "react";
import { fetchPartitions } from "../api";

interface Props {
  tableName: string;
}

interface PartitionData {
  partitions: { key: string; count: number }[];
  stats: {
    totalItems: number;
    uniquePartitions: number;
    maxItemsInPartition: number;
    avgItemsPerPartition: number;
    hotPartitionRatio: number;
  };
}

export function PartitionVisualizer({ tableName }: Props) {
  const [data, setData] = useState<PartitionData | null>(null);

  useEffect(() => {
    fetchPartitions(tableName).then(setData);
  }, [tableName]);

  if (!data) return <p className="text-sm text-gray-500">Loading partitions...</p>;

  const { partitions, stats } = data;
  const max = stats.maxItemsInPartition;
  const isHot = stats.hotPartitionRatio > 3;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-400">
        Partition Key Distribution
      </h3>

      {/* Stats bar */}
      <div className="flex gap-4 text-xs">
        <span className="text-gray-400">
          Partitions: <span className="text-white">{stats.uniquePartitions}</span>
        </span>
        <span className="text-gray-400">
          Total items: <span className="text-white">{stats.totalItems}</span>
        </span>
        <span className="text-gray-400">
          Avg/partition: <span className="text-white">{stats.avgItemsPerPartition}</span>
        </span>
        <span className="text-gray-400">
          Max: <span className={isHot ? "text-red-400" : "text-white"}>{stats.maxItemsInPartition}</span>
        </span>
        <span className="text-gray-400">
          Hot ratio:{" "}
          <span className={isHot ? "text-red-400 font-bold" : "text-green-400"}>
            {stats.hotPartitionRatio}x
          </span>
        </span>
      </div>

      {isHot && (
        <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded px-3 py-2">
          🔥 Hot partition detected! The largest partition has {stats.hotPartitionRatio}x the average
          number of items. Consider write sharding or time-bucketing to spread the load.
        </p>
      )}

      {/* Bar chart */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {partitions.map((p) => {
          const pct = (p.count / max) * 100;
          const isThisHot = p.count / stats.avgItemsPerPartition > 3;
          return (
            <div key={p.key} className="flex items-center gap-2 text-xs">
              <span className="w-48 truncate text-gray-400 font-mono text-right" title={p.key}>
                {p.key}
              </span>
              <div className="flex-1 bg-gray-900 rounded h-5 overflow-hidden">
                <div
                  className={`h-full rounded transition-all ${
                    isThisHot ? "bg-red-500/70" : "bg-blue-500/70"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-gray-300">{p.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
