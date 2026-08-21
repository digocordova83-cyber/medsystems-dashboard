const baseUrl = process.env.BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL;
if (!baseUrl) throw new Error("BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL não configurada.");

const response = await fetch(`${baseUrl}crm.lead.fields.json`, {
  headers: { accept: "application/json" },
  signal: AbortSignal.timeout(60_000),
});
const payload = await response.json();
if (!response.ok || payload.error) throw new Error(payload.error_description || payload.error || `Bitrix24 ${response.status}`);

const target = /respons|informa..es da fonte|fonte|etapa|posi..o|produto de interesse|pipeline de vendas|title|status|assigned/i;
const fields = Object.entries(payload.result ?? {}).flatMap(([key, definition]) => {
  const labels = [definition?.title, definition?.listLabel, definition?.formLabel, definition?.filterLabel]
    .filter(Boolean)
    .map(String);
  if (!target.test(`${key} ${labels.join(" ")}`)) return [];
  return [{
    key,
    labels: [...new Set(labels)],
    type: definition?.type ?? null,
    multiple: Boolean(definition?.isMultiple),
    items: Array.isArray(definition?.items)
      ? definition.items.map(item => ({ id: String(item.ID ?? item.VALUE ?? item.id ?? ""), value: String(item.VALUE ?? item.NAME ?? item.value ?? "") }))
      : [],
  }];
});

async function post(method, body) {
  const result = await fetch(`${baseUrl}${method}.json`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  const data = await result.json();
  if (!result.ok || data.error) throw new Error(data.error_description || data.error || `Bitrix24 ${result.status}`);
  return data.result;
}

const responsibleIds = ["5521", "13877", "38111", "25441", "57359", "7111", "56793", "96"];
const [statuses, users, leadResponsibles] = await Promise.all([
  post("crm.status.list", { filter: { ENTITY_ID: "STATUS" }, order: { SORT: "ASC" } }),
  Promise.all(responsibleIds.map(async id => {
    try {
      const result = await post("user.get", { filter: { ID: id } });
      const user = Array.isArray(result) ? result[0] : null;
      return { id, name: user ? [user.NAME, user.LAST_NAME].filter(Boolean).join(" ") : null };
    } catch {
      return { id, name: null };
    }
  })),
  post("crm.lead.list", {
    filter: { TITLE: "Oportunidade do RD Station" },
    order: { DATE_CREATE: "DESC" },
    select: ["ID", "ASSIGNED_BY_ID", "ASSIGNED_BY_NAME", "ASSIGNED_BY_ID.NAME", "ASSIGNED_BY_ID.LAST_NAME"],
    start: 0,
  }),
]);

console.log(JSON.stringify({
  fields,
  statuses: Array.isArray(statuses) ? statuses.map(item => ({ id: String(item.STATUS_ID ?? ""), name: String(item.NAME ?? "") })) : [],
  users,
  leadResponsibles: Array.isArray(leadResponsibles) ? leadResponsibles.map(item => ({
    id: String(item.ASSIGNED_BY_ID ?? ""),
    name: item.ASSIGNED_BY_NAME ?? item["ASSIGNED_BY_ID.NAME"] ?? null,
    lastName: item["ASSIGNED_BY_ID.LAST_NAME"] ?? null,
  })) : [],
}, null, 2));
