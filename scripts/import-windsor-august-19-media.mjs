import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const sources = [
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-20_13-20-47.715225575_windsor-ai_get_data_fedbac0d.json", platform: "google_ads", brand: "medsystems", accountId: "672-710-7654", leadField: "conversions" },
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-20_13-21-03.196167426_windsor-ai_get_data_2d87a512.json", platform: "google_ads", brand: "beautysystems", accountId: "864-759-2401", leadField: "conversions" },
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-20_13-21-16.887969336_windsor-ai_get_data_377da7c6.json", platform: "meta_ads", brand: "medsystems", accountId: "446269251699575", leadField: "actions_lead" },
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-20_13-21-32.178489116_windsor-ai_get_data_40298c3c.json", platform: "meta_ads", brand: "beautysystems", accountId: "1655942005167160", leadField: "actions_lead" },
];

const numeric = value => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const readRows = async path => {
  const envelope = JSON.parse(await fs.readFile(path, "utf8"));
  return JSON.parse(envelope.content?.[0]?.text ?? "[]");
};

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não está disponível.");
const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  for (const source of sources) {
    const rows = await readRows(source.path);
    for (const row of rows) {
      if (!row.date || !row.campaign_id) continue;
      await connection.execute(
        `INSERT INTO mediaDailyPerformance
          (platform, recordLevel, brand, reportDate, accountId, campaignId, campaignName, spend, impressions, reach, clicks, platformLeads, platformConversions, rawPayload, syncedAt)
         VALUES (?, 'campaign', ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE campaignName = VALUES(campaignName), spend = VALUES(spend), impressions = VALUES(impressions), reach = VALUES(reach), clicks = VALUES(clicks), platformLeads = VALUES(platformLeads), platformConversions = VALUES(platformConversions), rawPayload = VALUES(rawPayload), syncedAt = NOW()`,
        [source.platform, source.brand, new Date(`${row.date}T12:00:00.000Z`), source.accountId, String(row.campaign_id), String(row.campaign ?? "Sem nome"), numeric(row.spend), Math.round(numeric(row.impressions)), Math.round(numeric(row.clicks)), numeric(row[source.leadField]), source.platform === "google_ads" ? numeric(row.conversions) : 0, JSON.stringify(row)],
      );
    }
  }
  console.log(JSON.stringify({ status: "ok", period: "2026-08-01 a 2026-08-19", sources: sources.map(({ brand, platform }) => ({ brand, platform })) }));
} finally {
  await connection.end();
}
