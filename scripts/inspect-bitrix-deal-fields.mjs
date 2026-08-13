const baseUrl = process.env.BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL;
if (!baseUrl) throw new Error("Webhook Bitrix24 não configurado.");

const response = await fetch(`${baseUrl}crm.deal.fields.json`, { signal: AbortSignal.timeout(20_000) });
const payload = await response.json();
if (!response.ok || payload.error) throw new Error(payload.error_description || payload.error || "Falha ao consultar campos de negócio.");

const relevant = Object.entries(payload.result ?? {})
  .filter(([key, field]) => !key.startsWith("UF_CRM_") && (/OPPORTUNITY|CURRENCY|STAGE|CLOSE|SOURCE|LOSE|REASON|ORIGIN|MOTIV|DESCART|COMMENTS/i.test(key) || /origem|motivo|perda|descarte|valor|fechamento/i.test(String(field.title ?? ""))))
  .map(([key, field]) => ({ key, title: field.title ?? null, type: field.type ?? null, userType: field.userType ?? null }));

console.log(JSON.stringify(relevant, null, 2));
