const baseUrl = process.env.BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL;

if (!baseUrl) {
  throw new Error("BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL não configurada");
}

const url = `${baseUrl.replace(/\/$/, "")}/crm.lead.fields.json`;
const response = await fetch(url);
if (!response.ok) throw new Error(`Bitrix24 respondeu ${response.status}`);

const payload = await response.json() as { result?: Record<string, { title?: string; type?: string; items?: Array<{ ID?: string; VALUE?: string }> }> };
const matches = Object.entries(payload.result ?? {})
  .filter(([id]) => id.startsWith("UF_CRM_"))
  .map(([id, field]) => ({ id, title: field.title ?? "", type: field.type ?? "", items: field.items ?? [] }));

console.log(JSON.stringify(matches, null, 2));
