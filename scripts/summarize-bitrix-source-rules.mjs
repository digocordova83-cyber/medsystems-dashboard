import mysql from "mysql2/promise";
const START = "2026-08-01 03:00:00";
const END = "2026-08-24 03:00:00";
function parse(value) { try { return JSON.parse(value); } catch { return {}; } }
function walk(value, output = []) {
  if (value == null) return output;
  if (Array.isArray(value)) { value.forEach(item => walk(item, output)); return output; }
  if (typeof value === "object") { for (const [key, child] of Object.entries(value)) { if (typeof child === "object") walk(child, output); else output.push({ key, value: String(child).trim() }); } return output; }
  return output;
}
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await db.query(`SELECT rawPayload FROM bitrix24Entities WHERE entityType='lead' AND createdAtBitrix >= ? AND createdAtBitrix < ?`, [START, END]);
  const counts = new Map();
  for (const row of rows) {
    const items = walk(parse(row.rawPayload));
    const id = items.find(item => item.key === "SOURCE_ID")?.value ?? "";
    const desc = items.find(item => item.key === "SOURCE_DESCRIPTION")?.value ?? "";
    const key = `${id} | ${desc}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const grouped = {};
  for (const [key, count] of counts) { const [id, ...rest] = key.split(" | "); const desc = rest.join(" | "); const family = desc.split(" | ")[0] || "(sem descrição)"; grouped[id] ??= { familySamples: {}, total: 0 }; grouped[id].total += count; grouped[id].familySamples[family] = (grouped[id].familySamples[family] ?? 0) + count; }
  console.log(JSON.stringify({ total: rows.length, sourceIds: grouped, topCombinations: Object.fromEntries([...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,35)) }, null, 2));
} finally { await db.end(); }
