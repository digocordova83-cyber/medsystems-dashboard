const baseUrl = process.env.BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL;
if (!baseUrl) throw new Error("Webhook Bitrix24 não configurado.");

const endpoints = {
  leads: "crm.lead.fields.json",
  contatos: "crm.contact.fields.json",
  negocios: "crm.deal.fields.json",
};

const output = {};
for (const [entity, endpoint] of Object.entries(endpoints)) {
  const response = await fetch(`${baseUrl}${endpoint}`, { signal: AbortSignal.timeout(15_000) });
  const payload = await response.json();
  if (!response.ok || payload.error) throw new Error(`Não foi possível obter campos de ${entity}.`);
  output[entity] = Object.entries(payload.result ?? {})
    .filter(([key]) => /DATE|CREATE|MODIFY/i.test(key))
    .map(([key, value]) => ({ key, type: value.type ?? null, title: value.title ?? null }));
}
console.log(JSON.stringify(output, null, 2));
