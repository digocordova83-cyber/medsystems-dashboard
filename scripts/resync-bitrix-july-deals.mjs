import { syncMedsystemsJulyEntity } from "../server/bitrix24/service.ts";

const result = await syncMedsystemsJulyEntity("deal");
console.log(JSON.stringify({ entityType: result.entityType, importedCount: result.importedCount, totals: result.totals }, null, 2));
