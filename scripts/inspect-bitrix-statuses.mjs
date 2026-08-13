const baseUrl = process.env.BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL;
if (!baseUrl) throw new Error("Webhook Bitrix24 não configurado.");

async function getStatuses(entityId) {
  const response = await fetch(`${baseUrl}crm.status.list.json`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filter: { ENTITY_ID: entityId } }),
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json();
  if (!response.ok || payload.error) throw new Error(payload.error_description || payload.error || `Falha para ${entityId}.`);
  return (payload.result ?? []).map(status => ({ statusId: status.STATUS_ID, name: status.NAME, semantic: status.SEMANTICS ?? null }));
}

const sourceIds = new Set(["68", "69", "70", "71", "106", "CALL", "UC_45K0VX"]);
const sources = (await getStatuses("SOURCE")).filter(status => sourceIds.has(String(status.statusId)));
const lossStages = Object.fromEntries(await Promise.all(["DEAL_STAGE_42", "DEAL_STAGE_44", "DEAL_STAGE_57"].map(async entityId => [entityId, (await getStatuses(entityId)).filter(status => String(status.statusId).endsWith(":LOSE"))])));
console.log(JSON.stringify({ sources, lossStages }, null, 2));
