import { rdOpportunityManagerDashboard, rdOpportunityManagerDashboardsByAccount } from "../server/bitrix24/rdOpportunityAnalytics.ts";

const startDate = "2026-09-01";
const endDate = "2026-09-20";
const start = new Date(`${startDate}T00:00:00-03:00`);
const end = new Date(`${endDate}T00:00:00-03:00`);
end.setDate(end.getDate() + 1);
const filters = { pipeline: "all", responsible: "all", source: "all", stage: "all", position: "all", product: "all", campaign: "all", adset: "all", creative: "all" };
const portal = new URL(process.env.BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL).host;
const result = await rdOpportunityManagerDashboard({
  portal,
  start,
  end,
  startDate,
  endDate,
  filters,
});
const byBu = await rdOpportunityManagerDashboardsByAccount({
  portal,
  start,
  end,
  startDate,
  endDate,
  filters,
});
console.log(JSON.stringify({
  period: result.period,
  totals: result.totals,
  pipelines: result.filterOptions.pipelines,
  stages: result.stages,
  products: result.products.slice(0, 30),
  byBu: Object.fromEntries(Object.entries(byBu).map(([brand, dashboard]) => [brand, {
    totals: dashboard.totals,
    stages: dashboard.stages,
    byDay: dashboard.byDay,
    pacing: dashboard.pacing,
  }])),
}, null, 2));
process.exit(0);
