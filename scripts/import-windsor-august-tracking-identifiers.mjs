import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const SOURCES = [
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-14_19-09-59.874876925_windsor-ai_get_data_4a4e4faf.json", platform: "google_ads", accountId: "672-710-7654" },
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-14_19-10-10.174919084_windsor-ai_get_data_3da24fef.json", platform: "google_ads", accountId: "864-759-2401" },
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-14_19-10-57.248345163_windsor-ai_get_data_39a2a77f.json", platform: "meta_ads", accountId: "446269251699575" },
  { path: "/home/ubuntu/.mcp/tool-results/2026-08-14_19-11-15.086787317_windsor-ai_get_data_4cb5f0fa.json", platform: "meta_ads", accountId: "1655942005167160" },
];

async function readRows(path) {
  const envelope = JSON.parse(await fs.readFile(path, "utf8"));
  return JSON.parse(envelope.content?.[0]?.text ?? "[]");
}

function valuesFromQuery(value, origin) {
  if (!value || typeof value !== "string") return [];
  const candidates = [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) candidates.push(...parsed);
  } catch {
    candidates.push(value);
  }
  const rows = [];
  for (const candidate of candidates) {
    try {
      const query = candidate.includes("://") ? new URL(candidate).searchParams : new URLSearchParams(candidate.replace(/^\?/, ""));
      for (const parameter of ["utm_campaign", "utm_content", "utm_term"]) {
        const tracked = query.get(parameter)?.trim();
        if (tracked && !["null", "undefined"].includes(tracked.toLowerCase())) rows.push({ parameter, value: tracked, origin });
      }
    } catch {
      // Valores inválidos não são promovidos a identificadores de tracking.
    }
  }
  return rows;
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não está disponível para importar evidências de tracking.");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const updated = new Map();

try {
  for (const source of SOURCES) {
    const rows = await readRows(source.path);
    for (const row of rows) {
      const campaignId = String(row.campaign_id ?? "");
      const adId = String(row.ad_id ?? "");
      const reportDate = row.date;
      if (!campaignId || !adId || !reportDate) continue;
      const identifiers = [
        ...valuesFromQuery(row.ad_final_urls, "final_url"),
        ...valuesFromQuery(row.ad_final_url_suffix, "final_url_suffix"),
        ...valuesFromQuery(row.ad_tracking_url_template, "tracking_template"),
        ...valuesFromQuery(row.ad_url_custom_parameters, "custom_parameters"),
        ...valuesFromQuery(row.campaign_tracking_setting_tracking_url, "campaign_tracking"),
        ...valuesFromQuery(row.website_destination_url, "website_destination_url"),
        ...valuesFromQuery(row.link_url, "link_url"),
        ...valuesFromQuery(row.object_url, "object_url"),
        ...valuesFromQuery(row.url_tags, "url_tags"),
      ];
      if (!identifiers.length) continue;
      const [existing] = await connection.execute(
        `SELECT rawPayload FROM mediaDailyPerformance WHERE platform = ? AND recordLevel = 'ad' AND accountId = ? AND reportDate = ? AND campaignId = ? AND adId = ? LIMIT 1`,
        [source.platform, source.accountId, new Date(`${reportDate}T12:00:00.000Z`), campaignId, adId],
      );
      if (!existing.length) continue;
      const raw = JSON.parse(existing[0].rawPayload);
      raw._trackingIdentifiers = identifiers;
      await connection.execute(
        `UPDATE mediaDailyPerformance SET rawPayload = ?, syncedAt = NOW() WHERE platform = ? AND recordLevel = 'ad' AND accountId = ? AND reportDate = ? AND campaignId = ? AND adId = ?`,
        [JSON.stringify(raw), source.platform, source.accountId, new Date(`${reportDate}T12:00:00.000Z`), campaignId, adId],
      );
      const key = `${source.platform}:${source.accountId}`;
      updated.set(key, (updated.get(key) ?? 0) + 1);
    }
  }
  console.log(JSON.stringify(Object.fromEntries(updated), null, 2));
} finally {
  await connection.end();
}
