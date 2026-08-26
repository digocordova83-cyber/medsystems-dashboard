import mysql from "mysql2/promise";
import fs from "node:fs/promises";

const START = "2026-08-01 03:00:00";
const END = "2026-08-24 03:00:00";
const OUT = "/home/ubuntu/exports/bitrix-midia-paga-2026-08-01-a-2026-08-23.json";
function parse(value) { try { return JSON.parse(value); } catch { return {}; } }
function flat(value, prefix = "", out = {}) {
  if (value == null) return out;
  if (Array.isArray(value)) { value.forEach((v, i) => flat(v, `${prefix}[${i}]`, out)); return out; }
  if (typeof value === "object") { for (const [k, v] of Object.entries(value)) flat(v, prefix ? `${prefix}.${k}` : k, out); return out; }
  out[prefix] = String(value);
  return out;
}
function find(flattened, names) { const wanted = new Set(names.map(n => n.toLowerCase())); const entry = Object.entries(flattened).find(([key, value]) => wanted.has(key.split(".").at(-1).toLowerCase()) && value !== ""); return entry?.[1] ?? ""; }
function findKey(flattened, pattern) { const entry = Object.entries(flattened).find(([key, value]) => pattern.test(key) && value !== ""); return entry?.[1] ?? ""; }
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [dbRows] = await db.query(`SELECT bitrixId, portal, entityType, rawPayload, createdAtBitrix, updatedAtBitrix FROM bitrix24Entities WHERE entityType='lead' AND createdAtBitrix >= ? AND createdAtBitrix < ?`, [START, END]);
  const rows = [];
  for (const row of dbRows) {
    const payload = parse(row.rawPayload);
    const f = flat(payload);
    const sourceDescription = find(f, ["SOURCE_DESCRIPTION"]);
    if (!/^Paid Search\s*\|/i.test(sourceDescription)) continue;
    const pipeline = find(f, ["UF_CRM_1739195085"]);
    const brand = pipeline === "15391" ? "Medsystems" : pipeline === "15395" ? "BeautySystems" : "Não identificado";
    rows.push({
      bitrix_id: row.bitrixId, portal: row.portal, entity_type: row.entityType,
      criado_em_bitrix: row.createdAtBitrix, atualizado_em_bitrix: row.updatedAtBitrix,
      marca_pipeline: brand, pipeline_vendas_codigo: pipeline,
      titulo: find(f, ["TITLE"]), nome: find(f, ["NAME"]), sobrenome: find(f, ["LAST_NAME"]),
      email: findKey(f, /(^|\.)email/i), telefone: findKey(f, /(^|\.)(phone|telefone)/i),
      origem_id: find(f, ["SOURCE_ID"]), origem_descricao: sourceDescription,
      utm_source: findKey(f, /utm[_\.](source|medium|campaign|content|term)/i),
      utm_medium: findKey(f, /utm[_\.]medium/i), utm_campaign: findKey(f, /utm[_\.]campaign/i),
      utm_content: findKey(f, /utm[_\.]content/i), utm_term: findKey(f, /utm[_\.]term/i),
      etapa: find(f, ["STATUS_ID", "STAGE_ID"]), posicao: findKey(f, /posi[cç][aã]o/i),
      produto_interesse: findKey(f, /produto.*interesse|interest.*product/i),
      responsavel_id: find(f, ["ASSIGNED_BY_ID"]), responsavel_nome: findKey(f, /assigned.*name|respons[aá]vel/i),
      titulo_operacional: find(f, ["TITLE"]),
      payload_completo: payload,
    });
  }
  const summary = { total: rows.length, por_marca: {}, por_origem_id: {} };
  for (const r of rows) { summary.por_marca[r.marca_pipeline] = (summary.por_marca[r.marca_pipeline] ?? 0) + 1; summary.por_origem_id[r.origem_id || "(vazio)"] = (summary.por_origem_id[r.origem_id || "(vazio)"] ?? 0) + 1; }
  await fs.writeFile(OUT, JSON.stringify({ periodo: "01/08/2026 a 23/08/2026 BRT", regra: "SOURCE_DESCRIPTION atual iniciado por Paid Search", summary, rows }, null, 2));
  console.log(JSON.stringify({ output: OUT, ...summary }, null, 2));
} finally { await db.end(); }
