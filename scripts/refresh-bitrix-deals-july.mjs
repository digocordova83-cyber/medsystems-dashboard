import { syncMedsystemsJulyEntity } from "../server/bitrix24/service.ts";

const result = await syncMedsystemsJulyEntity("deal");
console.log(JSON.stringify({ period: "2026-07", entityType: result.entityType, importedCount: result.importedCount, total: result.totals.deal ?? 0 }, null, 2));
