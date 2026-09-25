import { writeFile } from "node:fs/promises";
import { mediaDashboardAnalytics } from "../server/db.ts";
import { programmaticDashboard } from "../server/publya/dashboard.ts";
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

const periods = [
  { key: "2026-07", label: "Julho/2026", start: "2026-07-01", end: "2026-07-31" },
  { key: "2026-08", label: "Agosto/2026", start: "2026-08-01", end: "2026-08-31" },
  { key: "2026-09", label: "Setembro/2026 até 23/09", start: "2026-09-01", end: "2026-09-23" },
];

const round = (value, digits = 2) => Number(Number(value ?? 0).toFixed(digits));
const pct = (current, previous) => previous ? round(((current - previous) / previous) * 100, 1) : null;
const sum = (rows, key) => rows.reduce((acc, row) => acc + Number(row?.[key] ?? 0), 0);

const output = { generatedAt: new Date().toISOString(), sourceCut: "internal dashboard data available at generation", periods: [] };

for (const period of periods) {
  const [media, programmatic, byBu] = await Promise.all([
    mediaDashboardAnalytics("all", period.key),
    programmaticDashboard({ startDate: period.start, endDate: period.end }),
    medsystemsBitrixRdOpportunityDashboardsByAccount({ startDate: period.start, endDate: period.end, filters }),
  ]);

  const buRows = [
    { brand: "medsystems", ...byBu.medsystems },
    { brand: "beautysystems", ...byBu.beautysystems },
  ].map((row) => ({
    brand: row.brand,
    totals: row.totals,
    funnel: row.funnel,
    pacing: row.pacing,
    stages: row.stages,
    campaigns: row.campaigns?.slice?.(0, 20) ?? [],
    coverage: row.coverage,
  }));

  output.periods.push({
    ...period,
    media: {
      totals: media.media,
      platforms: media.platforms,
      brandPlatforms: media.brandPlatforms,
      campaigns: media.campaigns.slice(0, 20),
      rdLeads: media.rdLeads,
      rdUtmLeads: media.rdUtmLeads,
      bitrixArrivals: media.bitrixArrivals,
    },
    programmatic: {
      totals: programmatic.totals,
      quality: programmatic.quality,
      campaigns: programmatic.campaigns,
      push: programmatic.push,
      lastDataDate: programmatic.lastDataDate,
    },
    funnel: {
      consolidated: {
        totals: {
          leads: sum(buRows, "totals.leads"),
        },
      },
      byBu: buRows,
    },
  });
}

const july = output.periods[0];
const august = output.periods[1];
const september = output.periods[2];
const julyFunnel = july.funnel.byBu.map((x) => x.totals);
const augustFunnel = august.funnel.byBu.map((x) => x.totals);
output.comparisons = {
  julyToAugust: {
    mediaSpend: { july: round(july.media.totals.spend), august: round(august.media.totals.spend), changePct: pct(august.media.totals.spend, july.media.totals.spend) },
    mediaImpressions: { july: july.media.totals.impressions, august: august.media.totals.impressions, changePct: pct(august.media.totals.impressions, july.media.totals.impressions) },
    mediaClicks: { july: july.media.totals.clicks, august: august.media.totals.clicks, changePct: pct(august.media.totals.clicks, july.media.totals.clicks) },
    platformLeads: { july: july.media.totals.platformLeads, august: august.media.totals.platformLeads, changePct: pct(august.media.totals.platformLeads, july.media.totals.platformLeads) },
    funnelByBu: {
      medsystems: { july: julyFunnel[0], august: augustFunnel[0] },
      beautysystems: { july: julyFunnel[1], august: augustFunnel[1] },
    },
  },
  septemberMtd: {
    media: september.media.totals,
    programmatic: september.programmatic.totals,
    funnelByBu: september.funnel.byBu.map((x) => ({ brand: x.brand, totals: x.totals })),
  },
};
await writeFile("/tmp/bbro-study-data-2026-09-25.json", JSON.stringify(output, null, 2), "utf8");
console.log(JSON.stringify({ generatedAt: output.generatedAt, periods: output.periods.map((p) => ({ key: p.key, media: p.media.totals, programmatic: p.programmatic.totals, byBu: p.funnel.byBu.map((x) => ({ brand: x.brand, totals: x.totals })) })), comparisons: output.comparisons }, null, 2));
