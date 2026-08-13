import mysql from "mysql2/promise";

const baseUrl = process.env.BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL;
const databaseUrl = process.env.DATABASE_URL;
const targetField = process.env.TARGET_FIELD;
if (!baseUrl || !databaseUrl) throw new Error("As variáveis de conexão do Bitrix24 ou banco não estão disponíveis.");

const response = await fetch(`${baseUrl}crm.deal.userfield.list.json`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: "{}",
  signal: AbortSignal.timeout(20_000),
});
const payload = await response.json();
if (!response.ok || payload.error) throw new Error(payload.error_description || payload.error || `Bitrix24 retornou ${response.status}.`);

const connection = await mysql.createConnection(databaseUrl);
try {
  const [rows] = await connection.execute("SELECT rawPayload FROM bitrix24Entities WHERE entityType = 'deal' AND createdAtBitrix >= ? AND createdAtBitrix < ?", [new Date("2026-07-01T00:00:00-03:00"), new Date("2026-08-01T00:00:00-03:00")]);
  const counts = new Map();
  for (const row of rows) {
    const deal = JSON.parse(row.rawPayload);
    for (const [key, value] of Object.entries(deal)) {
      if (!key.startsWith("UF_CRM_") || value === null || value === undefined || value === "" || value === "0") continue;
      const item = counts.get(key) ?? { count: 0, values: new Map() };
      item.count += 1;
      const normalized = Array.isArray(value) ? value.join(" | ") : String(value);
      item.values.set(normalized, (item.values.get(normalized) ?? 0) + 1);
      counts.set(key, item);
    }
  }

  const userFields = Array.isArray(payload.result) ? payload.result : Object.values(payload.result ?? {});
  const fields = userFields.map(field => [String(field.FIELD_NAME ?? field.field_name ?? field.ID ?? ""), field]);
  const output = fields.map(([fieldName, field]) => {
    const activity = counts.get(fieldName);
    return {
      field: fieldName,
      label: String(field.EDIT_FORM_LABEL ?? field.LIST_COLUMN_LABEL ?? field.LIST_FILTER_LABEL ?? field.title ?? "Sem rótulo"),
      type: String(field.USER_TYPE_ID ?? field.type ?? ""),
      required: field.MANDATORY === "Y" || Boolean(field.isRequired),
      filledDealsInJuly: activity?.count ?? 0,
      options: Array.isArray(field.LIST) ? field.LIST.map(option => ({ id: String(option.ID ?? ""), value: String(option.VALUE ?? "") })).slice(0, 100) : [],
      observedValues: activity ? Array.from(activity.values, ([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count).slice(0, 15) : [],
    };
  }).filter(field => field.field.startsWith("UF_CRM_") && (field.filledDealsInJuly > 0 || /perd|descart|motivo|cancel|recus|qualif|status/i.test(field.label)));

  const enumerations = output.filter(field => field.type === "enumeration" && field.filledDealsInJuly > 0).map(field => ({
    ...field,
    observedValues: field.observedValues.filter(item => /^[0-9]+$/.test(item.value)),
  }));
  const brandEnumerations = enumerations.filter(field => field.options.some(option => /medsystem|beauty/i.test(option.value)));
  const lossDiscardEnumerations = enumerations.filter(field => field.options.some(option => /perd|descart|motivo|cancel|recus|desist|sem retorno|desinteresse/i.test(option.value)));
  const summarize = fields => fields.map(field => {
    const optionById = new Map(field.options.map(option => [option.id, option.value]));
    return {
      field: field.field,
      filledDealsInJuly: field.filledDealsInJuly,
      observedOptions: field.observedValues.map(item => ({ id: item.value, option: optionById.get(item.value) ?? `ID ${item.value}`, count: item.count })),
      relevantConfiguredOptions: field.options.filter(option => /medsystem|beauty|perd|descart|motivo|cancel|recus|desist|sem retorno|desinteresse/i.test(option.value)).map(option => option.value),
    };
  });
  const target = targetField ? enumerations.filter(field => field.field === targetField) : [];
  console.log(JSON.stringify(targetField ? { targetField, fields: summarize(target) } : {
    metadataFields: userFields.length,
    brandEnumerations: summarize(brandEnumerations),
    lossDiscardEnumerations: summarize(lossDiscardEnumerations),
  }, null, 2));
} finally {
  await connection.end();
}
