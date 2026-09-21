import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => {
  if (value.startsWith("--")) pairs.push([value.slice(2), all[index + 1]]);
  return pairs;
}, []));

if (!args.input) throw new Error("Use --input <arquivo Windsor ad-level>.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não está disponível.");

const accountMap = {
  "446269251699575": { platform: "meta_ads", brand: "medsystems" },
  "1655942005167160": { platform: "meta_ads", brand: "beautysystems" },
};

const numeric = value => Number.isFinite(Number(value ?? 0)) ? Number(value ?? 0) : 0;
const dateKey = value => new Date(value).toLocaleDateString("en-CA", { timeZone: "UTC" });
const rowKey = row => [String(row.accountId), dateKey(row.reportDate), String(row.campaignId), String(row.adGroupId ?? ""), String(row.adId ?? "")].join("|");

async function resultRows(path) {
  const envelope = JSON.parse(await fs.readFile(path, "utf8"));
  if (Array.isArray(envelope?.structuredContent?.result)) return envelope.structuredContent.result;
  return JSON.parse(envelope?.content?.[0]?.text ?? "[]");
}

const rows = await resultRows(args.input);
const validRows = rows.filter(row => accountMap[String(row.account_id)] && row.date && row.campaign_id && row.adset_id && row.ad_id);
if (!validRows.length) throw new Error("Nenhuma linha ad-level válida foi encontrada.");

const minDate = validRows.reduce((min, row) => row.date < min ? row.date : min, validRows[0].date);
const maxDate = validRows.reduce((max, row) => row.date > max ? row.date : max, validRows[0].date);
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const accountIds = Object.keys(accountMap);
  const [existingRows] = await connection.execute(`
    SELECT accountId, reportDate, campaignId, adGroupId, adId, rawPayload
    FROM mediaDailyPerformance
    WHERE platform = 'meta_ads'
      AND recordLevel = 'ad'
      AND accountId IN (?, ?)
      AND reportDate >= ?
      AND reportDate < DATE_ADD(?, INTERVAL 1 DAY)
  `, [accountIds[0], accountIds[1], new Date(`${minDate}T12:00:00.000Z`), new Date(`${maxDate}T12:00:00.000Z`)]);

  const existingThumbnails = new Map();
  for (const existing of existingRows) {
    try {
      const payload = JSON.parse(existing.rawPayload);
      if (payload.thumbnail_storage_path) existingThumbnails.set(rowKey(existing), payload.thumbnail_storage_path);
    } catch {
      // Preserva a atualização mesmo quando um payload histórico estiver malformado.
    }
  }

  const summary = {};
  for (const row of validRows) {
    const account = accountMap[String(row.account_id)];
    const reportDate = new Date(`${row.date}T12:00:00.000Z`);
    const key = [String(row.account_id), row.date, String(row.campaign_id), String(row.adset_id), String(row.ad_id)].join("|");
    const rawPayload = {
      ...row,
      thumbnail_storage_path: existingThumbnails.get(key) ?? row.thumbnail_url ?? null,
    };

    await connection.execute(`INSERT INTO mediaDailyPerformance
      (platform, recordLevel, brand, reportDate, accountId, accountName, campaignId, campaignName, adGroupId, adGroupName, adId, adName, spend, impressions, reach, clicks, platformLeads, platformConversions, rawPayload, syncedAt)
      VALUES ('meta_ads', 'ad', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NOW())
      ON DUPLICATE KEY UPDATE
        brand=VALUES(brand), accountName=VALUES(accountName), campaignName=VALUES(campaignName),
        adGroupName=VALUES(adGroupName), adName=VALUES(adName), spend=VALUES(spend),
        impressions=VALUES(impressions), reach=VALUES(reach), clicks=VALUES(clicks),
        platformLeads=VALUES(platformLeads), platformConversions=VALUES(platformConversions),
        rawPayload=VALUES(rawPayload), syncedAt=NOW()`, [
      account.brand,
      reportDate,
      String(row.account_id),
      String(row.account_name ?? ""),
      String(row.campaign_id),
      String(row.campaign ?? "Sem nome"),
      String(row.adset_id),
      String(row.adset_name ?? "Sem conjunto"),
      String(row.ad_id),
      String(row.ad_name ?? "Sem nome"),
      numeric(row.spend),
      Math.round(numeric(row.impressions)),
      Math.round(numeric(row.reach)),
      Math.round(numeric(row.clicks)),
      numeric(row.actions_lead),
      JSON.stringify(rawPayload),
    ]);

    summary[account.brand] ??= { rows: 0, spend: 0, firstDate: row.date, lastDate: row.date, activeRows: 0 };
    summary[account.brand].rows += 1;
    summary[account.brand].spend += numeric(row.spend);
    if (row.effective_status === "ACTIVE") summary[account.brand].activeRows += 1;
    if (row.date < summary[account.brand].firstDate) summary[account.brand].firstDate = row.date;
    if (row.date > summary[account.brand].lastDate) summary[account.brand].lastDate = row.date;
  }
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await connection.end();
}
