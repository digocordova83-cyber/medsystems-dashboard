import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const sources = [
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-25_02-37-28.031447207_windsor-ai_get_data_c3a0174c.json", platform: "google_ads", brand: "medsystems", accountId: "672-710-7654", leadField: "conversions" },
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-25_02-37-38.499413370_windsor-ai_get_data_56aed712.json", platform: "google_ads", brand: "beautysystems", accountId: "864-759-2401", leadField: "conversions" },
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-25_02-37-48.146602877_windsor-ai_get_data_22f6d833.json", platform: "meta_ads", brand: "medsystems", accountId: "446269251699575", leadField: "actions_lead" },
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-25_02-37-57.944894532_windsor-ai_get_data_802679c9.json", platform: "meta_ads", brand: "beautysystems", accountId: "1655942005167160", leadField: "actions_lead" },
];

const numeric = value => Number.isFinite(Number(value ?? 0)) ? Number(value ?? 0) : 0;
async function rowsFromResult(path) {
  const envelope = JSON.parse(await fs.readFile(path, "utf8"));
  return JSON.parse(envelope.content?.[0]?.text ?? "[]");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não está disponível.");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const totals = {};
try {
  for (const source of sources) {
    const rows = await rowsFromResult(source.path);
    for (const row of rows) {
      if (!row.date || !row.campaign_id) continue;
      const spend = numeric(row.spend);
      const impressions = Math.round(numeric(row.impressions));
      const reach = Math.round(numeric(row.reach));
      const clicks = Math.round(numeric(row.clicks));
      const platformLeads = numeric(row[source.leadField]);
      const conversions = source.platform === "google_ads" ? numeric(row.conversions) : 0;
      await connection.execute(`INSERT INTO mediaDailyPerformance
        (platform, recordLevel, brand, reportDate, accountId, campaignId, campaignName, spend, impressions, reach, clicks, platformLeads, platformConversions, rawPayload, syncedAt)
        VALUES (?, 'campaign', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE campaignName=VALUES(campaignName), spend=VALUES(spend), impressions=VALUES(impressions), reach=VALUES(reach), clicks=VALUES(clicks), platformLeads=VALUES(platformLeads), platformConversions=VALUES(platformConversions), rawPayload=VALUES(rawPayload), syncedAt=NOW()`,
        [source.platform, source.brand, new Date(`${row.date}T12:00:00.000Z`), source.accountId, String(row.campaign_id), String(row.campaign ?? "Sem nome"), spend, impressions, reach, clicks, platformLeads, conversions, JSON.stringify(row)]);
      const key = `${source.brand}:${source.platform}`;
      totals[key] ??= { registros: 0, investimento: 0, leads: 0, ultimaData: row.date };
      totals[key].registros += 1;
      totals[key].investimento += spend;
      totals[key].leads += platformLeads;
      if (row.date > totals[key].ultimaData) totals[key].ultimaData = row.date;
    }
  }
  console.log(JSON.stringify({ period: "2026-08-01 a 2026-08-23", totals }, null, 2));
} finally {
  await connection.end();
}
@@
-      await connection.execute(`INSERT INTO mediaDailyPerformance
-        (platform, recordLevel, brand, reportDate, accountId, campaignId, campaignName, spend, impressions, reach, clicks, platformLeads, platformConversions, rawPayload, syncedAt)
-        VALUES (?, 'campaign', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
+      await connection.execute(`INSERT INTO mediaDailyPerformance
+        (platform, recordLevel, brand, reportDate, accountId, campaignId, campaignName, adGroupId, adId, spend, impressions, reach, clicks, platformLeads, platformConversions, rawPayload, syncedAt)
+        VALUES (?, 'campaign', ?, ?, ?, ?, ?, '', '', ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE campaignName=VALUES(campaignName), spend=VALUES(spend), impressions=VALUES(impressions), reach=VALUES(reach), clicks=VALUES(clicks), platformLeads=VALUES(platformLeads), platformConversions=VALUES(platformConversions), rawPayload=VALUES(rawPayload), syncedAt=NOW()`,
