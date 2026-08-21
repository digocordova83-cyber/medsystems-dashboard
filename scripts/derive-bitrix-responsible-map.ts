import { readFileSync } from "node:fs";
import { inArray } from "drizzle-orm";
import { bitrix24Entities } from "../drizzle/schema";
import { getDb } from "../server/db";

const source = process.argv[2];
if (!source) throw new Error("Informe o caminho do mapa de IDs da exportação.");
const namesByLeadId = JSON.parse(readFileSync(source, "utf8")) as Record<string, string>;
const ids = Object.keys(namesByLeadId).map(Number).filter(Number.isInteger);
const db = await getDb();
if (!db) throw new Error("Banco indisponível.");

const combinations = new Map<string, Map<string, number>>();
for (let offset = 0; offset < ids.length; offset += 500) {
  const rows = await db.select({ bitrixId: bitrix24Entities.bitrixId, rawPayload: bitrix24Entities.rawPayload })
    .from(bitrix24Entities)
    .where(inArray(bitrix24Entities.bitrixId, ids.slice(offset, offset + 500)));
  for (const row of rows) {
    const name = namesByLeadId[String(row.bitrixId)];
    if (!name) continue;
    let raw: Record<string, unknown> = {};
    try { raw = JSON.parse(row.rawPayload) as Record<string, unknown>; } catch { continue; }
    const assignedId = String(raw.ASSIGNED_BY_ID ?? "").trim();
    if (!assignedId) continue;
    const names = combinations.get(assignedId) ?? new Map<string, number>();
    names.set(name, (names.get(name) ?? 0) + 1);
    combinations.set(assignedId, names);
  }
}

const result = Array.from(combinations, ([assignedId, names]) => ({
  assignedId,
  names: Array.from(names, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
})).sort((a, b) => Number(a.assignedId) - Number(b.assignedId));

console.log(JSON.stringify(result, null, 2));
