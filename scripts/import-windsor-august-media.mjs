import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const sources = [
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-14_14-03-47.862568544_windsor-ai_get_data_00544bf3.json", platform: "google_ads", brand: "medsystems", accountId: "672-710-7654", leadField: "conversions" },
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-14_14-03-58.931176956_windsor-ai_get_data_f4c78c1c.json", platform: "google_ads", brand: "beautysystems", accountId: "864-759-2401", leadField: "conversions" },
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-14_14-04-07.881147862_windsor-ai_get_data_003c5172.json", platform: "meta_ads", brand: "medsystems", accountId: "446269251699575", leadField: "actions_lead" },
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-14_14-04-21.246428575_windsor-ai_get_data_610e6199.json", platform: "meta_ads", brand: "beautysystems", accountId: "1655942005167160", leadField: "actions_lead" },
];

function numeric(value) {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

async function rowsFromResult(path) {
  const envelope = JSON.parse(await fs.readFile(path, "utf8"));
  return JSON.parse(envelope.content?.[0]?.text ?? "[]");
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não está disponível.");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const totals = new Map();

try {
  for (const source of sources) {
    const rows = await rowsFromResult(source.path);
    for (const row of rows) {
      if (!row.date || !row.campaign_id) continue;
      const spend = numeric(row.spend);
      const impressions = Math.round(numeric(row.impressions));
      const clicks = Math.round(numeric(row.clicks));
      const platformLeads = numeric(row[source.leadField]);
      const conversions = source.platform === "google_ads" ? numeric(row.conversions) : 0;
      await connection.execute(
        `INSERT INTO mediaDailyPerformance
          (platform, recordLevel, brand, reportDate, accountId, campaignId, campaignName, spend, impressions, reach, clicks, platformLeads, platformConversions, rawPayload, syncedAt)
         VALUES (?, 'campaign', ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE campaignName = VALUES(campaignName), spend = VALUES(spend), impressions = VALUES(impressions), reach = VALUES(reach), clicks = VALUES(clicks), platformLeads = VALUES(platformLeads), platformConversions = VALUES(platformConversions), rawPayload = VALUES(rawPayload), syncedAt = NOW()`,
        [source.platform, source.brand, new Date(`${row.date}T12:00:00.000Z`), source.accountId, String(row.campaign_id), String(row.campaign ?? "Sem nome"), spend, impressions, clicks, platformLeads, conversions, JSON.stringify(row)],
      );
      const key = `${source.brand}:${source.platform}`;
      const total = totals.get(key) ?? { registros: 0, investimento: 0, impressoes: 0, cliques: 0, leads: 0 };
      total.registros += 1;
      total.investimento += spend;
      total.impressoes += impressions;
      total.cliques += clicks;
      total.leads += platformLeads;
      totals.set(key, total);
    }
  }
  console.log(JSON.stringify(Object.fromEntries(totals), null, 2));
} finally {
  await connection.end();
}
