import mysql from "mysql2/promise";
const START = "2026-08-01 03:00:00";
const END = "2026-08-24 03:00:00";
function parse(value) { try { return JSON.parse(value); } catch { return {}; } }
function walk(value, path = "", output = []) {
  if (value == null) return output;
  if (Array.isArray(value)) { value.forEach((item, i) => walk(item, `${path}[${i}]`, output)); return output; }
  if (typeof value === "object") { for (const [key, child] of Object.entries(value)) walk(child, path ? `${path}.${key}` : key, output); return output; }
  output.push({ key: path.split(".").at(-1)?.replace(/\[\d+\]$/, "") ?? "", path, value: String(value).trim() });
  return output;
}
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await db.query(`SELECT bitrixId, rawPayload FROM bitrix24Entities WHERE entityType='lead' AND createdAtBitrix >= ? AND createdAtBitrix < ?`, [START, END]);
  const counts = new Map();
  const keyCounts = new Map();
  const examples = [];
  let paid = 0, utm = 0, sourceDesc = 0, sourceId = 0, rd = 0, event = 0;
  for (const row of rows) {
    const raw = String(row.rawPayload ?? "");
    const payload = parse(raw);
    const items = walk(payload);
    const sourceItems = items.filter(item => /^(source|source_id|source_description|origem|fonte)$/i.test(item.key) || /source_description|source_id/i.test(item.path));
    for (const item of sourceItems) { if (!item.value) continue; const key = `${item.key} = ${item.value}`; counts.set(key, (counts.get(key) ?? 0) + 1); keyCounts.set(item.key, (keyCounts.get(item.key) ?? 0) + 1); }
    const lower = raw.toLowerCase();
    if (/paid\s+(search|social)|trafego\s+pago|tráfego\s+pago/.test(lower)) paid++;
    if (/utm_source|utm_medium|utm_campaign|utm_content|utm_term/.test(lower)) utm++;
    if (/source_description/.test(lower)) sourceDesc++;
    if (/source_id/.test(lower)) sourceId++;
    if (/rd.?station|rdstation/.test(lower)) rd++;
    if (/evento|importa[cç][aã]o|importation/.test(lower)) event++;
    if (examples.length < 8 && sourceItems.length) examples.push({ bitrixId: row.bitrixId, sourceItems: sourceItems.slice(0, 12) });
  }
  console.log(JSON.stringify({ total: rows.length, paid, utm, sourceDesc, sourceId, rd, event, sourceKeyCounts: Object.fromEntries(keyCounts), sourceValues: Object.fromEntries([...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,40)), examples }, null, 2));
} finally { await db.end(); }
