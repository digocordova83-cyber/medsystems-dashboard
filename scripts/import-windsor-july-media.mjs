import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const SOURCES = [
  {
    path: "/home/ubuntu/.mcp/tool-results/2026-08-13_19-01-09.752126359_windsor-ai_get_data_eebed9be.json",
    platform: "google_ads",
    brands: {
      "672-710-7654": "medsystems",
      "864-759-2401": "beautysystems",
    },
  },
  {
    path: "/home/ubuntu/.mcp/tool-results/2026-08-13_19-02-24.067032858_windsor-ai_get_data_0d4e1eb4.json",
    platform: "meta_ads",
    brands: {
      "446269251699575": "medsystems",
      "1655942005167160": "beautysystems",
    },
  },
];

function number(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function readWindsorRows(path) {
  const envelope = JSON.parse(await fs.readFile(path, "utf8"));
  return JSON.parse(envelope.content?.[0]?.text ?? "[]");
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não está disponível para importar os dados de mídia.");

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const totals = new Map();

try {
  for (const source of SOURCES) {
    const rows = await readWindsorRows(source.path);
    for (const row of rows) {
      const accountId = String(row.account_id ?? "");
      const brand = source.brands[accountId];
      const campaignId = String(row.campaign_id ?? row.campaign ?? "");
      if (!brand || !campaignId || !row.date) continue;

      const spend = number(row.spend ?? row.cost);
      const impressions = Math.round(number(row.impressions));
      const reach = Math.round(number(row.reach));
      const clicks = Math.round(number(row.clicks));
      const platformLeads = source.platform === "meta_ads" ? number(row.actions_lead) : number(row.conversions);
      const platformConversions = source.platform === "google_ads" ? number(row.conversions) : 0;

      await connection.execute(
        `INSERT INTO mediaDailyPerformance
        (platform, recordLevel, brand, reportDate, accountId, accountName, campaignId, campaignName, spend, impressions, reach, clicks, platformLeads, platformConversions, rawPayload, syncedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          accountName = VALUES(accountName), campaignName = VALUES(campaignName), spend = VALUES(spend),
          impressions = VALUES(impressions), reach = VALUES(reach), clicks = VALUES(clicks),
          platformLeads = VALUES(platformLeads), platformConversions = VALUES(platformConversions),
          rawPayload = VALUES(rawPayload), syncedAt = NOW()`,
        [
          source.platform,
          "campaign",
          brand,
          new Date(`${row.date}T12:00:00.000Z`),
          accountId,
          row.account_name ? String(row.account_name) : null,
          campaignId,
          row.campaign_name ? String(row.campaign_name) : (row.campaign ? String(row.campaign) : null),
          spend,
          impressions,
          reach,
          clicks,
          platformLeads,
          platformConversions,
          JSON.stringify(row),
        ],
      );

      const key = `${brand}:${source.platform}`;
      const summary = totals.get(key) ?? { rows: 0, spend: 0, impressions: 0, clicks: 0, leads: 0 };
      summary.rows += 1;
      summary.spend += spend;
      summary.impressions += impressions;
      summary.clicks += clicks;
      summary.leads += platformLeads;
      totals.set(key, summary);
    }
  }
  console.log(JSON.stringify(Object.fromEntries(totals), null, 2));
} finally {
  await connection.end();
}
