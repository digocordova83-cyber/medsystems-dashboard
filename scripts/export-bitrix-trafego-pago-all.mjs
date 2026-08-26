import mysql from "mysql2/promise";
import fs from "node:fs/promises";

const OUT = "/home/ubuntu/exports/bitrix-trafego-pago-todas-entidades.json";
const START = "2026-08-01 03:00:00";
const END = "2026-08-26 03:00:00";
function parse(v) { try { return JSON.parse(v); } catch { return {}; } }
function flat(value, prefix = "", out = {}) {
  if (value == null) return out;
  if (Array.isArray(value)) { value.forEach((v, i) => flat(v, `${prefix}[${i}]`, out)); return out; }
  if (typeof value === "object") { for (const [k, v] of Object.entries(value)) flat(v, prefix ? `${prefix}.${k}` : k, out); return out; }
  out[prefix] = String(value); return out;
}
function find(f, names) { const set = new Set(names.map(n => n.toLowerCase())); const e = Object.entries(f).find(([k,v]) => set.has(k.split(".").at(-1).toLowerCase()) && v); return e?.[1] ?? ""; }
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rawRows] = await db.query(`SELECT bitrixId, portal, entityType, rawPayload, createdAtBitrix, updatedAtBitrix FROM bitrix24Entities WHERE entityType IN ('lead','deal','contact') AND updatedAtBitrix >= ? AND updatedAtBitrix < ?`, [START, END]);
  const rows = [];
  const sourceCounts = {};
  for (const r of rawRows) {
    const payload = parse(r.rawPayload); const f = flat(payload);
    const description = find(f, ["SOURCE_DESCRIPTION"]);
    if (!/tr[aá]fego\s+pago/i.test(description)) continue;
    const pipeline = find(f, ["UF_CRM_1739195085"]);
    const marca = pipeline === "15391" ? "Medsystems" : pipeline === "15395" ? "BeautySystems" : "Não identificado";
    sourceCounts[description] = (sourceCounts[description] ?? 0) + 1;
    rows.push({ bitrix_id: r.bitrixId, portal: r.portal, tipo: r.entityType, criado_em: r.createdAtBitrix, atualizado_em: r.updatedAtBitrix, marca, pipeline_codigo: pipeline, nome: find(f,["NAME"]), sobrenome: find(f,["LAST_NAME"]), titulo: find(f,["TITLE"]), email: Object.entries(f).find(([k,v]) => /(^|\.)email/i.test(k) && v)?.[1] ?? "", telefone: Object.entries(f).find(([k,v]) => /(^|\.)(phone|telefone)/i.test(k) && v)?.[1] ?? "", source_id: find(f,["SOURCE_ID"]), source_description: description, utm_source: Object.entries(f).find(([k,v]) => /utm[_\.]source/i.test(k) && v)?.[1] ?? "", utm_medium: Object.entries(f).find(([k,v]) => /utm[_\.]medium/i.test(k) && v)?.[1] ?? "", utm_campaign: Object.entries(f).find(([k,v]) => /utm[_\.]campaign/i.test(k) && v)?.[1] ?? "", etapa: find(f,["STATUS_ID","STAGE_ID"]), responsavel_id: find(f,["ASSIGNED_BY_ID"]), payload_completo: payload });
  }
  const summary = { total: rows.length, by_type: {}, by_brand: {}, source_counts: sourceCounts, period: "01/08/2026 a 25/08/2026 BRT", rule: "SOURCE_DESCRIPTION contém Tráfego Pago" };
  for (const r of rows) { summary.by_type[r.tipo] = (summary.by_type[r.tipo] ?? 0)+1; summary.by_brand[r.marca] = (summary.by_brand[r.marca] ?? 0)+1; }
  await fs.writeFile(OUT, JSON.stringify({ summary, rows }, null, 2)); console.log(JSON.stringify({ output: OUT, summary }, null, 2));
} finally { await db.end(); }
