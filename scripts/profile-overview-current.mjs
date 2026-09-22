import { mediaDashboardAnalytics } from "../server/db.ts";
const started = Date.now();
const result = await mediaDashboardAnalytics("all", "2026-09");
console.log(JSON.stringify({ elapsedMs: Date.now() - started, spend: result.media.spend, campaigns: result.campaigns.length, ads: result.ads.length, rdLeads: result.rdUtmLeads, bitrixArrivals: result.bitrixArrivals }, null, 2));
