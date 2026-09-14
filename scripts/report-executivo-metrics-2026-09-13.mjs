import { medsystemsBitrixRdOpportunityDashboardsByAccount } from "../server/bitrix24/service.ts";

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

const dashboards = await medsystemsBitrixRdOpportunityDashboardsByAccount({
  startDate: "2026-09-01",
  endDate: "2026-09-13",
  filters,
});

function summarize(dashboard) {
  const paidPacing = dashboard.pacing.paid.find(item => item.brand === dashboard.pacing.total[0]?.brand);
  return {
    totals: {
      leads: dashboard.totals.leads,
      mql: dashboard.totals.mql,
      sql: dashboard.totals.sql,
      mqlToSql: dashboard.totals.mql ? Number(((dashboard.totals.sql / dashboard.totals.mql) * 100).toFixed(1)) : 0,
      paidLeads: paidPacing?.actual ?? 0,
      pacing: dashboard.pacing,
    },
    campaigns: dashboard.attribution
      .filter(item => item.campaign !== "Não identificado" && item.mql > 0)
      .map(item => ({ campaign: item.campaign, leads: item.leads, mql: item.mql, sql: item.sql, mqlToSql: item.mql ? Number(((item.sql / item.mql) * 100).toFixed(1)) : 0 }))
      .sort((a, b) => b.mql - a.mql || b.sql - a.sql || a.campaign.localeCompare(b.campaign))
      .slice(0, 8),
  };
}

console.log(JSON.stringify({
  period: "2026-09-01 a 2026-09-13",
  medsystems: summarize(dashboards.medsystems),
  beautysystems: summarize(dashboards.beautysystems),
}, null, 2));
