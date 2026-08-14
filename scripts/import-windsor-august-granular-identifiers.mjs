import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const SOURCES = [
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-14_15-37-27.764840622_windsor-ai_get_data_9a83cf76.json", platform: "google_ads", brand: "medsystems", accountId: "672-710-7654" },
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-14_15-39-51.593132599_windsor-ai_get_data_9097a117.json", platform: "google_ads", brand: "beautysystems", accountId: "864-759-2401" },
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-14_15-38-01.505692318_windsor-ai_get_data_a78fdad2.json", platform: "meta_ads", brand: "medsystems", accountId: "446269251699575" },
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-14_15-38-30.092596936_windsor-ai_get_data_9aad2875.json", platform: "meta_ads", brand: "beautysystems", accountId: "1655942005167160" },
];

async function readRows(path) {
  const envelope = JSON.parse(await fs.readFile(path, "utf8"));
  return JSON.parse(envelope.content?.[0]?.text ?? "[]");
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não está disponível para importar identificadores granulares.");

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const totals = new Map();

try {
  const [campaignRows] = await connection.query("SELECT platform, accountId, campaignId, campaignName FROM mediaDailyPerformance WHERE recordLevel = 'campaign' AND reportDate >= '2026-08-01' AND reportDate < '2026-08-14'");
  const campaignNames = new Map(campaignRows.map(row => [`${row.platform}:${row.accountId}:${row.campaignId}`, row.campaignName]));
  for (const source of SOURCES) {
    const rows = await readRows(source.path);
    for (const row of rows) {
      const campaignId = String(row.campaign_id ?? "");
      const adGroupId = String(source.platform === "google_ads" ? row.ad_group_id ?? "" : row.adset_id ?? "");
      const adId = String(row.ad_id ?? "");
      if (!campaignId || !adGroupId || !adId || !row.date) continue;
      const campaignName = row.campaign_name ?? campaignNames.get(`${source.platform}:${source.accountId}:${campaignId}`) ?? null;
      const adGroupName = source.platform === "google_ads" ? row.ad_group_name : row.adset_name;
      const adName = row.ad_name;
      await connection.execute(
        `INSERT INTO mediaDailyPerformance
        (platform, recordLevel, brand, reportDate, accountId, accountName, campaignId, campaignName, adGroupId, adGroupName, adId, adName, spend, impressions, reach, clicks, platformLeads, platformConversions, rawPayload, syncedAt)
        VALUES (?, 'ad', ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, ?, NOW())
        ON DUPLICATE KEY UPDATE campaignName = VALUES(campaignName), adGroupName = VALUES(adGroupName), adName = VALUES(adName), rawPayload = VALUES(rawPayload), syncedAt = NOW()`,
        [source.platform, source.brand, new Date(`${row.date}T12:00:00.000Z`), source.accountId, campaignId, campaignName ? String(campaignName) : null, adGroupId, adGroupName ? String(adGroupName) : null, adId, adName ? String(adName) : null, JSON.stringify(row)],
      );
      const key = `${source.brand}:${source.platform}`;
      totals.set(key, (totals.get(key) ?? 0) + 1);
    }
  }
  console.log(JSON.stringify(Object.fromEntries(totals), null, 2));
} finally {
  await connection.end();
}
