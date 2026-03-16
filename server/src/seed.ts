import {
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
} from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { rawClient, docClient, isLocal } from "./db.js";
import { models } from "./models/index.js";

async function waitForTable(tableName: string) {
  if (isLocal) return;
  console.log(`  ⏳ Waiting for ${tableName} to become ACTIVE...`);
  for (let i = 0; i < 60; i++) {
    const { Table } = await rawClient.send(
      new DescribeTableCommand({ TableName: tableName })
    );
    if (Table?.TableStatus === "ACTIVE") return;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Table ${tableName} did not become ACTIVE`);
}

async function resetTables() {
  const { TableNames = [] } = await rawClient.send(new ListTablesCommand({}));
  for (const table of models) {
    if (TableNames.includes(table.table.TableName!)) {
      await rawClient.send(
        new DeleteTableCommand({ TableName: table.table.TableName })
      );
      if (!isLocal) {
        console.log(`  ⏳ Waiting for ${table.table.TableName} to be deleted...`);
        for (let i = 0; i < 60; i++) {
          try {
            await rawClient.send(
              new DescribeTableCommand({ TableName: table.table.TableName })
            );
            await new Promise((r) => setTimeout(r, 2000));
          } catch {
            break;
          }
        }
      }
    }
    await rawClient.send(new CreateTableCommand(table.table));
    await waitForTable(table.table.TableName!);
    console.log(`✓ Created table: ${table.table.TableName}`);
  }
}

function generateAssetData() {
  const items: Record<string, unknown>[] = [];
  const factory = { id: "factory-01", name: "North Plant", type: "Factory" };

  items.push({
    PK: `ASSET#${factory.id}`,
    SK: "META",
    name: factory.name,
    type: factory.type,
    GSI1PK: `TYPE#${factory.type}`,
    GSI1SK: factory.id,
  });

  const lines = ["line-01", "line-02"];
  const stationsPer = 2;
  const machinesPer = 2;
  const sensorTypes = ["temperature", "vibration", "pressure"];

  for (const lineId of lines) {
    items.push({
      PK: `ASSET#${lineId}`,
      SK: "META",
      name: `Production ${lineId}`,
      type: "Line",
      GSI1PK: "TYPE#Line",
      GSI1SK: lineId,
    });
    items.push({
      PK: `ASSET#${factory.id}`,
      SK: `CHILD#${lineId}`,
      childId: lineId,
      childType: "Line",
    });

    for (let s = 1; s <= stationsPer; s++) {
      const stationId = `${lineId}-station-${String(s).padStart(2, "0")}`;
      items.push({
        PK: `ASSET#${stationId}`,
        SK: "META",
        name: `Station ${s}`,
        type: "Station",
        GSI1PK: "TYPE#Station",
        GSI1SK: stationId,
      });
      items.push({
        PK: `ASSET#${lineId}`,
        SK: `CHILD#${stationId}`,
        childId: stationId,
        childType: "Station",
      });

      for (let m = 1; m <= machinesPer; m++) {
        const machineId = `${stationId}-machine-${String(m).padStart(2, "0")}`;
        items.push({
          PK: `ASSET#${machineId}`,
          SK: "META",
          name: `Machine ${m}`,
          type: "Machine",
          GSI1PK: "TYPE#Machine",
          GSI1SK: machineId,
        });
        items.push({
          PK: `ASSET#${stationId}`,
          SK: `CHILD#${machineId}`,
          childId: machineId,
          childType: "Machine",
        });

        for (const sType of sensorTypes) {
          const sensorId = `${machineId}-${sType}`;
          items.push({
            PK: `ASSET#${sensorId}`,
            SK: "META",
            name: `${sType} sensor`,
            type: "Sensor",
            sensorType: sType,
            unit: sType === "temperature" ? "°C" : sType === "vibration" ? "mm/s" : "bar",
            GSI1PK: "TYPE#Sensor",
            GSI1SK: sensorId,
          });
          items.push({
            PK: `ASSET#${machineId}`,
            SK: `CHILD#${sensorId}`,
            childId: sensorId,
            childType: "Sensor",
          });
        }
      }
    }
  }
  return items;
}

function generateTelemetryData() {
  const items: Record<string, unknown>[] = [];
  const sensors = [
    "line-01-station-01-machine-01-temperature",
    "line-01-station-01-machine-01-vibration",
    "line-01-station-02-machine-01-pressure",
  ];
  const now = new Date();
  const hourBucket = now.toISOString().slice(0, 13);

  for (const sensor of sensors) {
    for (let i = 0; i < 30; i++) {
      const ts = new Date(now.getTime() - i * 60_000);
      items.push({
        PK: `SENSOR#${sensor}#${hourBucket}`,
        SK: ts.toISOString(),
        sensorId: sensor,
        value: +(20 + Math.random() * 10).toFixed(2),
        unit: sensor.includes("temperature") ? "°C" : sensor.includes("vibration") ? "mm/s" : "bar",
      });
    }
  }
  return items;
}

function generateAlarmData() {
  const items: Record<string, unknown>[] = [];
  const severities = ["CRITICAL", "WARNING", "INFO"];
  const machines = [
    "line-01-station-01-machine-01",
    "line-01-station-01-machine-02",
    "line-02-station-01-machine-01",
  ];
  const now = new Date();

  for (const machine of machines) {
    for (let i = 0; i < 5; i++) {
      const ts = new Date(now.getTime() - i * 300_000);
      const iso = ts.toISOString();
      const severity = severities[i % 3];
      const acked = i > 2;
      items.push({
        PK: `ASSET#${machine}`,
        SK: iso,
        alarmId: `alarm-${machine}-${i}`,
        severity,
        message: `${severity}: Threshold exceeded on ${machine}`,
        acknowledged: acked,
        ...(acked ? {} : { GSI1PK: `UNACK#${severity}`, GSI1SK: iso }),
      });
    }
  }
  return items;
}

function generateWorkOrderData() {
  const items: Record<string, unknown>[] = [];
  const machines = [
    "line-01-station-01-machine-01",
    "line-01-station-01-machine-02",
    "line-02-station-01-machine-01",
  ];
  const technicians = ["jsmith", "mjones", "klee"];
  const statuses = ["OPEN", "OPEN", "IN_PROGRESS", "CLOSED", "CLOSED"];
  const types = ["PREVENTIVE", "CORRECTIVE"];
  const now = new Date();

  for (const machine of machines) {
    for (let i = 0; i < 5; i++) {
      const created = new Date(now.getTime() - i * 86_400_000);
      const iso = created.toISOString();
      const status = statuses[i];
      const tech = technicians[i % 3];
      const woType = types[i % 2];
      const woId = `WO-${machine.slice(-2)}-${String(i).padStart(3, "0")}`;

      items.push({
        PK: `ASSET#${machine}`,
        SK: `WO#${iso}`,
        woId,
        woType,
        status,
        assignedTo: tech,
        description: `${woType} maintenance on ${machine}`,
        dueDate: new Date(created.getTime() + 7 * 86_400_000).toISOString().slice(0, 10),
        GSI1PK: `STATUS#${status}`,
        GSI1SK: iso,
        GSI2PK: `TECH#${tech}`,
        GSI2SK: iso,
      });
    }
  }
  return items;
}

function generateBatchGenealogyData() {
  const items: Record<string, unknown>[] = [];

  // Raw material lots
  for (let i = 1; i <= 3; i++) {
    const lotId = `lot-${String(i).padStart(3, "0")}`;
    items.push({
      PK: `LOT#${lotId}`,
      SK: "META",
      lotId,
      product: i <= 2 ? "raw-material-A" : "raw-material-B",
      quantity: 100 * i,
      unit: "kg",
      createdAt: `2026-03-${String(10 + i).padStart(2, "0")}T08:00:00Z`,
      stage: "RAW",
    });
    items.push({
      PK: `PRODUCT#${i <= 2 ? "raw-material-A" : "raw-material-B"}`,
      SK: `LOT#${lotId}`,
      lotId,
    });
  }

  // Intermediate lot consuming raw materials
  items.push({
    PK: "LOT#lot-004",
    SK: "META",
    lotId: "lot-004",
    product: "intermediate-X",
    quantity: 150,
    unit: "kg",
    createdAt: "2026-03-13T10:00:00Z",
    stage: "INTERMEDIATE",
  });
  items.push({ PK: "PRODUCT#intermediate-X", SK: "LOT#lot-004", lotId: "lot-004" });

  // lot-004 consumed lot-001 and lot-002
  for (const input of ["lot-001", "lot-002"]) {
    items.push({
      PK: `LOT#${input}`,
      SK: `OUTPUT#lot-004`,
      outputLot: "lot-004",
      GSI1PK: "LOT#lot-004",
      GSI1SK: `INPUT#${input}`,
      inputLot: input,
    });
  }

  // Final product lot consuming intermediate
  items.push({
    PK: "LOT#lot-005",
    SK: "META",
    lotId: "lot-005",
    product: "widget-A",
    quantity: 50,
    unit: "units",
    createdAt: "2026-03-14T14:00:00Z",
    stage: "FINISHED",
  });
  items.push({ PK: "PRODUCT#widget-A", SK: "LOT#lot-005", lotId: "lot-005" });

  items.push({
    PK: "LOT#lot-004",
    SK: "OUTPUT#lot-005",
    outputLot: "lot-005",
    GSI1PK: "LOT#lot-005",
    GSI1SK: "INPUT#lot-004",
    inputLot: "lot-004",
  });

  // Another final lot consuming lot-003 directly
  items.push({
    PK: "LOT#lot-006",
    SK: "META",
    lotId: "lot-006",
    product: "widget-B",
    quantity: 30,
    unit: "units",
    createdAt: "2026-03-15T09:00:00Z",
    stage: "FINISHED",
  });
  items.push({ PK: "PRODUCT#widget-B", SK: "LOT#lot-006", lotId: "lot-006" });
  items.push({
    PK: "LOT#lot-003",
    SK: "OUTPUT#lot-006",
    outputLot: "lot-006",
    GSI1PK: "LOT#lot-006",
    GSI1SK: "INPUT#lot-003",
    inputLot: "lot-003",
  });

  return items;
}

function generateOEEData() {
  const items: Record<string, unknown>[] = [];
  const machines = [
    "line-01-station-01-machine-01",
    "line-01-station-01-machine-02",
    "line-02-station-01-machine-01",
  ];
  const shifts = ["morning", "afternoon", "night"];

  for (const machine of machines) {
    for (let d = 0; d < 7; d++) {
      const date = `2026-03-${String(9 + d).padStart(2, "0")}`;
      let dayAvail = 0, dayPerf = 0, dayQual = 0;

      for (const shift of shifts) {
        const availability = +(0.75 + Math.random() * 0.2).toFixed(3);
        const performance = +(0.8 + Math.random() * 0.15).toFixed(3);
        const quality = +(0.9 + Math.random() * 0.08).toFixed(3);
        const oee = +(availability * performance * quality).toFixed(3);

        items.push({
          PK: `MACHINE#${machine}`,
          SK: `SHIFT#${date}#${shift}`,
          date,
          shift,
          availability,
          performance,
          quality,
          oee,
          GSI1PK: `DATE#${date}`,
          GSI1SK: `MACHINE#${machine}#SHIFT#${shift}`,
        });

        dayAvail += availability;
        dayPerf += performance;
        dayQual += quality;
      }

      // Daily rollup
      const avgA = +(dayAvail / 3).toFixed(3);
      const avgP = +(dayPerf / 3).toFixed(3);
      const avgQ = +(dayQual / 3).toFixed(3);
      items.push({
        PK: `MACHINE#${machine}`,
        SK: `DAY#${date}`,
        date,
        availability: avgA,
        performance: avgP,
        quality: avgQ,
        oee: +(avgA * avgP * avgQ).toFixed(3),
        GSI1PK: `DATE#${date}`,
        GSI1SK: `MACHINE#${machine}`,
      });
    }
  }
  return items;
}

async function writeBatch(tableName: string, items: Record<string, unknown>[]) {
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25);
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: batch.map((item) => ({ PutRequest: { Item: item } })),
        },
      })
    );
  }
  console.log(`  ↳ Wrote ${items.length} items to ${tableName}`);
}

async function seed() {
  console.log("\n🏭 DynaMFG — Seeding industrial data...\n");

  if (!process.env.DYNAMODB_ENDPOINT) {
    console.log("⚠️  No DYNAMODB_ENDPOINT set — this will create tables in your real AWS account.");
    console.log(`   Region: ${process.env.AWS_REGION || "us-east-1"}`);
    console.log("   Press Ctrl+C within 5 seconds to abort.\n");
    await new Promise((r) => setTimeout(r, 5000));
  }

  await resetTables();

  console.log("\nSeeding data:");
  await writeBatch("AssetHierarchy", generateAssetData());
  await writeBatch("Telemetry", generateTelemetryData());
  await writeBatch("Alarms", generateAlarmData());
  await writeBatch("WorkOrders", generateWorkOrderData());
  await writeBatch("BatchGenealogy", generateBatchGenealogyData());
  await writeBatch("OEEMetrics", generateOEEData());

  console.log("\n✅ Done! Run `npm run dev` to start the playground.\n");
}

seed().catch(console.error);
