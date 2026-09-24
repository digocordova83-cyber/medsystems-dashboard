import { programmaticDashboard } from "../server/publya/dashboard.ts";

const periods = [
  { label: "2026-08", startDate: "2026-08-01", endDate: "2026-08-31" },
  { label: "2026-09", startDate: "2026-09-01", endDate: "2026-09-23" },
];

const summaries = [];
for (const period of periods) {
  const result = await programmaticDashboard({ ...period, reportKey: "all" });
  summaries.push({
    period: period.label,
    lastDataDate: result.connection.lastDataDate,
    exactSnapshotAvailable: result.period.exactSnapshotAvailable,
    totals: result.totals,
    campaignCount: result.campaigns.length,
    campaigns: result.campaigns.map(row => ({
      campaignId: row.campaignId,
      campaignName: row.campaignName,
      platform: row.platform,
      reportType: row.reportType,
      objective: row.objective,
      spend: row.spend,
      impressions: row.impressions,
      reach: row.reach,
      clicks: row.clicks,
      leads: row.leads,
      conversions: row.conversions,
      counted: row.counted,
      duplicateOf: row.duplicateOf,
      reportUrl: row.reportUrl,
      dataDate: row.dataDate,
    })),
    push: result.push,
    reportOptions: result.reportOptions,
    formats: result.formats.length,
    creatives: result.creatives.length,
    sites: result.sites.length,
    publishers: result.publishers.length,
    warnings: result.warnings,
  });
}
console.log(
  JSON.stringify(
    { generatedAt: new Date().toISOString(), periods: summaries },
    null,
    2
  )
);
