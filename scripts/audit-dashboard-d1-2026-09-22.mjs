import fs from "node:fs/promises";
import { medsystemsBitrixRdOpportunityDashboardsByAccount } from "../server/bitrix24/service.ts";
import { mediaChannelDashboard } from "../server/media/channelDashboard.ts";
import { programmaticDashboard } from "../server/publya/dashboard.ts";

const startDate = "2026-09-01";
const endDate = "2026-09-22";
const filters = {
  pipeline: "all",
  responsible: "all",
  source: "all",
  stage: "all",
  position: "all",
  product: "all",
  campaign: "all",
  adset: "all",
  creative: "all",
};

const [business, google, meta, programmatic] = await Promise.all([
  medsystemsBitrixRdOpportunityDashboardsByAccount({ startDate, endDate, filters }),
  mediaChannelDashboard({ platform: "google_ads", brand: "all", startDate, endDate }),
  mediaChannelDashboard({ platform: "meta_ads", brand: "all", startDate, endDate }),
  programmaticDashboard({ startDate, endDate, reportKey: "all" }),
]);

const compactBusiness = Object.fromEntries(Object.entries(business).map(([accountKey, dashboard]) => [accountKey, {
  period: dashboard.period,
  totals: dashboard.totals,
  crmLeadUniverse: dashboard.crmLeadUniverse,
  funnel: dashboard.funnel,
} ]));
const output = {
  generatedAt: new Date().toISOString(),
  period: { startDate, endDate, timezone: "America/Sao_Paulo" },
  business: compactBusiness,
  media: {
    google: { period: google.period, totals: google.totals },
    meta: { period: meta.period, totals: meta.totals },
  },
  programmatic: { period: programmatic.period, totals: programmatic.totals, quality: programmatic.quality },
};
const path = "/tmp/medsystems-d1-2026-09-22/audit.json";
await fs.writeFile(path, JSON.stringify(output, null, 2), "utf8");
console.log(JSON.stringify(output, null, 2));
