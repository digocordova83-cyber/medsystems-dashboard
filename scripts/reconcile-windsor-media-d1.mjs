import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => {
  if (value.startsWith("--")) pairs.push([value.slice(2), all[index + 1]]);
  return pairs;
}, []));

if (!args.meta || !args.google) throw new Error("Use --meta <arquivo> --google <arquivo>.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não está disponível.");

const accountMap = {
  facebook: {
    "446269251699575": { platform: "meta_ads", brand: "medsystems" },
    "1655942005167160": { platform: "meta_ads", brand: "beautysystems" },
  },
  google_ads: {
    "672-710-7654": { platform: "google_ads", brand: "medsystems" },
    "864-759-2401": { platform: "google_ads", brand: "beautysystems" },
  },
};

const numeric = value => Number.isFinite(Number(value ?? 0)) ? Number(value ?? 0) : 0;
async function resultRows(path) {
  const envelope = JSON.parse(await fs.readFile(path, "utf8"));
  if (Array.isArray(envelope?.structuredContent?.result)) return envelope.structuredContent.result;
  return JSON.parse(envelope?.content?.[0]?.text ?? "[]");
}

const sources = [
  { connector: "facebook", path: args.meta },
  { connector: "google_ads", path: args.google },
];
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const summary = {};
try {
  for (const source of sources) {
    for (const row of await resultRows(source.path)) {
      const account = accountMap[source.connector]?.[String(row.account_id)];
      const campaignId = row.campaign_id ? String(row.campaign_id) : row.campaign ? `name:${row.campaign}` : null;
      if (!account || !row.date || !campaignId) continue;
      const leads = source.connector === "facebook" ? numeric(row.actions_lead) : numeric(row.conversions);
      if (row.campaign_id && row.campaign) {
        await connection.execute(`DELETE FROM mediaDailyPerformance
          WHERE platform = ? AND recordLevel = 'campaign' AND brand = ? AND reportDate = ?
            AND accountId = ? AND campaignId = ?`, [
          account.platform,
          account.brand,
          new Date(`${row.date}T12:00:00.000Z`),
          String(row.account_id),
          `name:${row.campaign}`,
        ]);
      }
      await connection.execute(`INSERT INTO mediaDailyPerformance
        (platform, recordLevel, brand, reportDate, accountId, accountName, campaignId, campaignName, adGroupId, adId, spend, impressions, reach, clicks, platformLeads, platformConversions, rawPayload, syncedAt)
        VALUES (?, 'campaign', ?, ?, ?, ?, ?, ?, '', '', ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE accountName=VALUES(accountName), campaignName=VALUES(campaignName), spend=VALUES(spend), impressions=VALUES(impressions), reach=VALUES(reach), clicks=VALUES(clicks), platformLeads=VALUES(platformLeads), platformConversions=VALUES(platformConversions), rawPayload=VALUES(rawPayload), syncedAt=NOW()`, [
        account.platform,
        account.brand,
        new Date(`${row.date}T12:00:00.000Z`),
        String(row.account_id),
        String(row.account_name ?? ""),
        campaignId,
        String(row.campaign ?? "Sem nome"),
        numeric(row.spend),
        Math.round(numeric(row.impressions)),
        source.connector === "facebook" ? Math.round(numeric(row.reach)) : 0,
        Math.round(numeric(row.clicks)),
        leads,
        source.connector === "google_ads" ? numeric(row.conversions) : 0,
        JSON.stringify(row),
      ]);
      const key = `${account.platform}:${account.brand}`;
      summary[key] ??= { rows: 0, spend: 0, firstDate: row.date, lastDate: row.date };
      summary[key].rows += 1;
      summary[key].spend += numeric(row.spend);
      if (row.date < summary[key].firstDate) summary[key].firstDate = row.date;
      if (row.date > summary[key].lastDate) summary[key].lastDate = row.date;
    }
  }
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await connection.end();
}
