import { syncMedsystemsEntityForPeriod } from "../server/bitrix24/service.ts";

const result = await syncMedsystemsEntityForPeriod("deal", "2026-08");
console.log(JSON.stringify(result, null, 2));
