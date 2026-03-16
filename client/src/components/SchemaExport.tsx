import { useState } from "react";
import { exportCloudFormation, exportCDK } from "../api";

interface Props {
  tableName: string;
}

export function SchemaExport({ tableName }: Props) {
  const [code, setCode] = useState("");
  const [format, setFormat] = useState<"cfn" | "cdk">("cfn");

  const doExport = async (fmt: "cfn" | "cdk") => {
    setFormat(fmt);
    if (fmt === "cfn") {
      const data = await exportCloudFormation(tableName);
      setCode(JSON.stringify(data, null, 2));
    } else {
      setCode(await exportCDK(tableName));
    }
  };

  const copy = () => navigator.clipboard.writeText(code);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-400">Export Schema</h3>
        <button
          onClick={() => doExport("cfn")}
          className={`text-xs px-2 py-1 rounded ${
            format === "cfn" && code ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          CloudFormation
        </button>
        <button
          onClick={() => doExport("cdk")}
          className={`text-xs px-2 py-1 rounded ${
            format === "cdk" && code ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          CDK (TypeScript)
        </button>
        {code && (
          <button onClick={copy} className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600">
            📋 Copy
          </button>
        )}
      </div>
      {code && (
        <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-80 overflow-y-auto">
          {code}
        </pre>
      )}
    </div>
  );
}
