const BASE = "/api";

export async function fetchModels() {
  const res = await fetch(`${BASE}/models`);
  return res.json();
}

export async function executeQuery(body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function fetchTableItems(tableName: string) {
  const res = await fetch(`${BASE}/tables/${tableName}/items`);
  return res.json();
}

export async function fetchPartitions(tableName: string) {
  const res = await fetch(`${BASE}/tables/${tableName}/partitions`);
  return res.json();
}

export async function exportCloudFormation(tableName: string) {
  const res = await fetch(`${BASE}/models/${tableName}/export/cloudformation`);
  return res.json();
}

export async function exportCDK(tableName: string) {
  const res = await fetch(`${BASE}/models/${tableName}/export/cdk`);
  return res.text();
}
