import assetHierarchy from "./asset-hierarchy.js";
import telemetry from "./telemetry.js";
import alarms from "./alarms.js";
import workOrders from "./work-orders.js";
import batchGenealogy from "./batch-genealogy.js";
import oee from "./oee.js";
import { ModelDefinition } from "../types.js";

export const models: ModelDefinition[] = [
  assetHierarchy,
  telemetry,
  alarms,
  workOrders,
  batchGenealogy,
  oee,
];
