import mysql from "mysql2/promise";

const base = process.env.BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL;
if (!base) throw new Error("BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL indisponível");

async function bitrix(method, params = {}) {
  const response = await fetch(`${base.replace(/\/$/, "")}/${method}.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error(`${method}: HTTP ${response.status}`);
  const json = await response.json();
  if (json.error) throw new Error(`${method}: ${json.error_description ?? json.error}`);
  return json.result;
}

const clean = value => String(value ?? "").trim();
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [fieldResult, statuses, dbRows] = await Promise.all([
    bitrix("crm.lead.fields"),
    bitrix("crm.status.list", { filter: { ENTITY_ID: "STATUS" }, order: { SORT: "ASC" } }),
    db.query("SELECT bitrixId, rawPayload FROM bitrix24Entities WHERE entityType='lead' AND createdAtBitrix >= ? AND createdAtBitrix < ?", ["2026-08-01 03:00:00", "2026-08-27 03:00:00"]).then(([rows]) => rows),
  ]);

  const relevantFields = Object.entries(fieldResult)
    .filter(([key, meta]) => /qualif|mql|sql|origem|fonte|campanha|conjunto|criativ|m[ií]dia|posi[cç][aã]o|produto|interesse/i.test(`${key} ${meta?.title ?? ""} ${meta?.listLabel ?? ""} ${meta?.formLabel ?? ""}`))
    .map(([key, meta]) => ({ key, title: meta?.title, listLabel: meta?.listLabel, formLabel: meta?.formLabel, type: meta?.type, items: meta?.items ?? [] }));

  const eligible = dbRows.map(row => ({ ...row, raw: JSON.parse(row.rawPayload) }))
    .filter(row => clean(row.raw.UF_CRM_1744808620).toLocaleLowerCase("pt-BR") === "tráfego pago");
  const statusCounts = {};
  const keyCounts = {};
  for (const row of eligible) {
    const status = clean(row.raw.STATUS_ID) || "(vazio)";
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    for (const field of relevantFields) {
      const value = clean(row.raw[field.key]);
      if (!value) continue;
      keyCounts[field.key] ??= {};
      keyCounts[field.key][value] = (keyCounts[field.key][value] ?? 0) + 1;
    }
  }
  console.log(JSON.stringify({
    eligiblePaidLeads: eligible.length,
    statuses: statuses.map(item => ({ id: item.STATUS_ID, name: item.NAME, sort: item.SORT, semantics: item.SEMANTICS, count: statusCounts[item.STATUS_ID] ?? 0 })),
    relevantFields,
    observedValues: keyCounts,
  }, null, 2));
} finally {
  await db.end();
}
