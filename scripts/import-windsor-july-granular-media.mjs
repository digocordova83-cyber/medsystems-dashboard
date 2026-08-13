import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const SOURCES = [
  {
    path: "/home/ubuntu/.mcp/tool-results/2026-08-13_19-20-38.433317963_windsor-ai_get_data_fa7886f7.json",
    platform: "google_ads",
    brands: { "672-710-7654": "medsystems", "864-759-2401": "beautysystems" },
  },
  {
    path: "/home/ubuntu/.mcp/tool-results/2026-08-13_19-21-42.958883518_windsor-ai_get_data_a868ee72.json",
    platform: "meta_ads",
    brands: { "446269251699575": "medsystems", "1655942005167160": "beautysystems" },
  },
];

function number(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function readRows(path) {
  const envelope = JSON.parse(await fs.readFile(path, "utf8"));
  return JSON.parse(envelope.content?.[0]?.text ?? "[]");
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não está disponível para importar os dados de mídia.");

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const totals = new Map();

try {
  for (const source of SOURCES) {
    const rows = await readRows(source.path);
    for (const row of rows) {
      const accountId = String(row.account_id ?? "");
      const brand = source.brands[accountId];
      const campaignId = String(row.campaign_id ?? row.campaign ?? "");
      const adGroupId = String(source.platform === "google_ads" ? row.ad_group_id ?? "" : row.adset_id ?? "");
      const adId = String(source.platform === "google_ads" ? row.ad_group_ad_ad_id ?? "" : row.ad_id ?? "");
      if (!brand || !campaignId || !adGroupId || !adId || !row.date) continue;

      const spend = number(row.spend ?? row.cost);
      const impressions = Math.round(number(row.impressions));
      const reach = Math.round(number(row.reach));
      const clicks = Math.round(number(row.clicks));
      const platformLeads = source.platform === "meta_ads" ? number(row.actions_lead) : number(row.conversions);
      const platformConversions = source.platform === "google_ads" ? number(row.conversions) : 0;
      const campaignName = source.platform === "google_ads" ? row.campaign_name : row.campaign;
      const adGroupName = source.platform === "google_ads" ? row.ad_group_name : row.adset_name;
      const adName = source.platform === "google_ads" ? row.ad_group_ad_ad_name : row.ad_name;

      await connection.execute(
        `INSERT INTO mediaDailyPerformance
        (platform, recordLevel, brand, reportDate, accountId, accountName, campaignId, campaignName, adGroupId, adGroupName, adId, adName, spend, impressions, reach, clicks, platformLeads, platformConversions, rawPayload, syncedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          campaignName = VALUES(campaignName), adGroupName = VALUES(adGroupName), adName = VALUES(adName),
          spend = VALUES(spend), impressions = VALUES(impressions), reach = VALUES(reach), clicks = VALUES(clicks),
          platformLeads = VALUES(platformLeads), platformConversions = VALUES(platformConversions), rawPayload = VALUES(rawPayload), syncedAt = NOW()`,
        [
          source.platform, "ad", brand, new Date(`${row.date}T12:00:00.000Z`), accountId, null, campaignId,
          campaignName ? String(campaignName) : null, adGroupId, adGroupName ? String(adGroupName) : null,
          adId, adName ? String(adName) : null, spend, impressions, reach, clicks, platformLeads, platformConversions, JSON.stringify(row),
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
