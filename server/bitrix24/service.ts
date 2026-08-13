import { bitrixDealJulyAnalytics, bitrixJulyTotals, finishBitrixSyncRun, startBitrixSyncRun, type BitrixEntityType, type DealStatusFilter, upsertBitrixEntities } from "../db";

const CRM_CAPABILITIES = ["Leads", "Contatos", "Negócios"] as const;
const JULY_2026_START = new Date("2026-07-01T00:00:00-03:00");
const JULY_2026_END = new Date("2026-08-01T00:00:00-03:00");
const ENTITY_METHOD: Record<BitrixEntityType, string> = {
  lead: "crm.lead.list",
  contact: "crm.contact.list",
  deal: "crm.deal.list",
};
const ENTITY_SELECT: Record<BitrixEntityType, string[]> = {
  lead: ["ID", "TITLE", "NAME", "LAST_NAME", "SECOND_NAME", "EMAIL", "PHONE", "STATUS_ID", "DATE_CREATE", "DATE_MODIFY"],
  contact: ["ID", "NAME", "LAST_NAME", "SECOND_NAME", "EMAIL", "PHONE", "DATE_CREATE", "DATE_MODIFY"],
  deal: ["ID", "TITLE", "STAGE_ID", "STAGE_SEMANTIC_ID", "CLOSED", "CLOSEDATE", "OPPORTUNITY", "CURRENCY_ID", "SOURCE_ID", "SOURCE_DESCRIPTION", "ORIGINATOR_ID", "ORIGIN_ID", "UTM_SOURCE", "COMMENTS", "DATE_CREATE", "DATE_MODIFY"],
};

function webhookBaseUrl() {
  const baseUrl = process.env.BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL;
  if (!baseUrl) throw new Error("O webhook Bitrix24 da Medsystems não está configurado.");
  return baseUrl;
}

async function bitrixList(entityType: BitrixEntityType, start: number) {
  const response = await fetch(`${webhookBaseUrl()}${ENTITY_METHOD[entityType]}.json`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      select: ENTITY_SELECT[entityType],
      order: { DATE_CREATE: "ASC" },
      filter: {
        ">=DATE_CREATE": "2026-07-01T00:00:00-03:00",
        "<DATE_CREATE": "2026-08-01T00:00:00-03:00",
      },
      start,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json() as { result?: Record<string, unknown>[]; next?: number; error?: string; error_description?: string };
  if (!response.ok || payload.error) throw new Error(payload.error_description || payload.error || `O Bitrix24 retornou ${response.status}.`);
  return { rows: Array.isArray(payload.result) ? payload.result : [], next: typeof payload.next === "number" ? payload.next : null };
}

function pause(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export async function medsystemsBitrixStatus() {
  const baseUrl = process.env.BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL;
  if (!baseUrl) return { connected: false, portal: null, capabilities: [] as string[] };
  try {
    const response = await fetch(`${baseUrl}profile.json`, { signal: AbortSignal.timeout(10_000) });
    const payload = await response.json() as { result?: unknown; error?: string };
    if (!response.ok || payload.error || !payload.result) throw new Error("Webhook não autenticado");
    return { connected: true, portal: new URL(baseUrl).host, capabilities: [...CRM_CAPABILITIES] };
  } catch {
    return { connected: false, portal: new URL(baseUrl).host, capabilities: [] as string[] };
  }
}

export async function syncMedsystemsJulyEntity(entityType: BitrixEntityType) {
  const baseUrl = webhookBaseUrl();
  const portal = new URL(baseUrl).host;
  const runId = await startBitrixSyncRun(portal, entityType, JULY_2026_START, JULY_2026_END);
  let start: number | null = 0;
  let importedCount = 0;
  try {
    while (start !== null) {
      const page = await bitrixList(entityType, start);
      importedCount += await upsertBitrixEntities({ portal, entityType, entities: page.rows });
      start = page.next;
      if (start !== null) await pause(650);
    }
    await finishBitrixSyncRun(runId, importedCount);
    return { entityType, importedCount, totals: await bitrixJulyTotals(portal, JULY_2026_START, JULY_2026_END) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida na importação Bitrix24.";
    await finishBitrixSyncRun(runId, importedCount, message);
    throw new Error(message);
  }
}

export async function medsystemsBitrixJulyTotals() {
  return bitrixJulyTotals(new URL(webhookBaseUrl()).host, JULY_2026_START, JULY_2026_END);
}

export async function medsystemsBitrixJulyDealAnalytics(statusFilter: DealStatusFilter = "all") {
  return bitrixDealJulyAnalytics(new URL(webhookBaseUrl()).host, JULY_2026_START, JULY_2026_END, statusFilter);
}
