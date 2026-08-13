import { syncMedsystemsJulyEntity } from "../server/bitrix24/service.ts";

const entityTypes = ["lead", "contact", "deal"];
const results = [];

for (const entityType of entityTypes) {
  const result = await syncMedsystemsJulyEntity(entityType);
  results.push({ entityType, importedCount: result.importedCount, total: result.totals[entityType] ?? 0 });
}

console.log(JSON.stringify({ period: "2026-07", results }, null, 2));
