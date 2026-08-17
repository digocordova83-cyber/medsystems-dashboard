import { medsystemsUtmReceiptCoverage } from "../server/bitrix24/service.ts";

const result = await medsystemsUtmReceiptCoverage("all", "2026-07");
console.log(JSON.stringify({
  period: result.period,
  bitrixIdentity: result.bitrix.identity,
  enrichment: result.bitrixRdEnrichment,
  rd: result.rd,
}, null, 2));
