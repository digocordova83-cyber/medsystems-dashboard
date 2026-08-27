import { bitrixCampaignAttributionDetail, bitrixDealBrand, bitrixDealJulyAnalytics, bitrixLeadChannelFunnel, bitrixJulyTotals, bitrixOperationsDashboard, bitrixReferencedContactIds, finishBitrixSyncRun, reconcileAttributionAuditLinks, reconcileBitrixEntities, refreshAttributionAuditFromBitrix, startBitrixSyncRun, type AnalyticsPeriod, type BitrixEntityType, type DealStatusFilter, upsertBitrixEntities, utmReceiptCoverage } from "../db";
import { rdOpportunityManagerDashboard, validateBusinessDateRange, type RdOpportunityFilters } from "./rdOpportunityAnalytics";

const CRM_CAPABILITIES = ["Leads", "Contatos", "Negócios"] as const;
const PERIODS: Record<AnalyticsPeriod, { start: Date; end: Date; bitrixStart: string; bitrixEnd: string }> = {
  "2026-07": { start: new Date("2026-07-01T00:00:00-03:00"), end: new Date("2026-08-01T00:00:00-03:00"), bitrixStart: "2026-07-01T00:00:00-03:00", bitrixEnd: "2026-08-01T00:00:00-03:00" },
  "2026-08": { start: new Date("2026-08-01T00:00:00-03:00"), end: new Date("2026-08-27T00:00:00-03:00"), bitrixStart: "2026-08-01T00:00:00-03:00", bitrixEnd: "2026-08-27T00:00:00-03:00" },
};
const ENTITY_METHOD: Record<BitrixEntityType, string> = { lead: "crm.lead.list", contact: "crm.contact.list", deal: "crm.deal.list" };
const ENTITY_SELECT: Record<BitrixEntityType, string[]> = {
  lead: ["*", "UF_*"],
  contact: ["ID", "NAME", "LAST_NAME", "SECOND_NAME", "EMAIL", "PHONE", "DATE_CREATE", "DATE_MODIFY"],
  deal: ["*", "UF_*"],
};

function webhookBaseUrl() {
  const baseUrl = process.env.BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL;
  if (!baseUrl) throw new Error("O webhook Bitrix24 da Medsystems não está configurado.");
  return baseUrl;
}

async function bitrixList(entityType: BitrixEntityType, start: number, range: { bitrixStart: string; bitrixEnd: string }) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${webhookBaseUrl()}${ENTITY_METHOD[entityType]}.json`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ select: ENTITY_SELECT[entityType], order: { DATE_CREATE: "ASC" }, filter: { ">=DATE_CREATE": range.bitrixStart, "<DATE_CREATE": range.bitrixEnd }, start }),
        signal: AbortSignal.timeout(60_000),
      });
      const payload = await response.json() as { result?: Record<string, unknown>[]; next?: number; error?: string; error_description?: string };
      if (!response.ok || payload.error) throw new Error(payload.error_description || payload.error || `O Bitrix24 retornou ${response.status}.`);
      return { rows: Array.isArray(payload.result) ? payload.result : [], next: typeof payload.next === "number" ? payload.next : null };
    } catch (error) {
      lastError = error;
      if (attempt < 3) await pause(1_000 * attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("O Bitrix24 não respondeu após três tentativas.");
}

async function bitrixContactsByIds(contactIds: number[]) {
  const response = await fetch(`${webhookBaseUrl()}crm.contact.list.json`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ select: ENTITY_SELECT.contact, order: { ID: "ASC" }, filter: { ID: contactIds }, start: 0 }), signal: AbortSignal.timeout(25_000),
  });
  const payload = await response.json() as { result?: Record<string, unknown>[]; error?: string; error_description?: string };
  if (!response.ok || payload.error) throw new Error(payload.error_description || payload.error || `O Bitrix24 retornou ${response.status}.`);
  return Array.isArray(payload.result) ? payload.result : [];
}

function pause(milliseconds: number) { return new Promise(resolve => setTimeout(resolve, milliseconds)); }

export async function medsystemsBitrixStatus() {
  const baseUrl = process.env.BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL;
  if (!baseUrl) return { connected: false, portal: null, capabilities: [] as string[] };
  try {
    const response = await fetch(`${baseUrl}profile.json`, { signal: AbortSignal.timeout(10_000) });
    const payload = await response.json() as { result?: unknown; error?: string };
    if (!response.ok || payload.error || !payload.result) throw new Error("Webhook não autenticado");
    return { connected: true, portal: new URL(baseUrl).host, capabilities: [...CRM_CAPABILITIES] };
  } catch { return { connected: false, portal: new URL(baseUrl).host, capabilities: [] as string[] }; }
}

export async function syncMedsystemsEntityForPeriod(entityType: BitrixEntityType, period: AnalyticsPeriod) {
  const range = PERIODS[period];
  const baseUrl = webhookBaseUrl();
  const portal = new URL(baseUrl).host;
  const runId = await startBitrixSyncRun(portal, entityType, range.start, range.end);
  let start: number | null = 0;
  let importedCount = 0;
  const returnedIds: number[] = [];
  const returnedDealIdsByBrand = { medsystems: [] as number[], beautysystems: [] as number[] };
  try {
    while (start !== null) {
      const page = await bitrixList(entityType, start, range);
      returnedIds.push(...page.rows.map(row => Number(row.ID)).filter(id => Number.isInteger(id) && id > 0));
      if (entityType === "deal") for (const row of page.rows) {
        const brand = bitrixDealBrand(row); const id = Number(row.ID);
        if (brand && Number.isInteger(id) && id > 0) returnedDealIdsByBrand[brand].push(id);
      }
      importedCount += await upsertBitrixEntities({ portal, entityType, entities: page.rows });
      start = page.next;
      if (start !== null) await pause(650);
    }
    await reconcileBitrixEntities({ portal, entityType, periodStart: range.start, periodEnd: range.end, bitrixIds: returnedIds });
    if (entityType === "deal" && period === "2026-07") {
      await refreshAttributionAuditFromBitrix({ brand: "medsystems", portal, start: range.start, end: range.end });
      await refreshAttributionAuditFromBitrix({ brand: "beautysystems", portal, start: range.start, end: range.end });
      await reconcileAttributionAuditLinks({ brand: "medsystems", bitrixDealIds: returnedDealIdsByBrand.medsystems });
      await reconcileAttributionAuditLinks({ brand: "beautysystems", bitrixDealIds: returnedDealIdsByBrand.beautysystems });
    }
    await finishBitrixSyncRun(runId, importedCount);
    return { entityType, period, importedCount, totals: await bitrixJulyTotals(portal, range.start, range.end) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida na importação Bitrix24.";
    await finishBitrixSyncRun(runId, importedCount, message);
    throw new Error(message);
  }
}

export async function syncMedsystemsReferencedContactsForPeriod(period: AnalyticsPeriod) {
  const range = PERIODS[period];
  const portal = new URL(webhookBaseUrl()).host;
  const contactIds = await bitrixReferencedContactIds({ portal, start: range.start, end: range.end });
  const contacts: Record<string, unknown>[] = [];
  for (let start = 0; start < contactIds.length; start += 50) {
    contacts.push(...await bitrixContactsByIds(contactIds.slice(start, start + 50)));
    if (start + 50 < contactIds.length) await pause(700);
  }
  const importedCount = await upsertBitrixEntities({ portal, entityType: "contact", entities: contacts });
  return { period, referencedContactIds: contactIds.length, importedCount };
}

export async function syncMedsystemsJulyEntity(entityType: BitrixEntityType) { return syncMedsystemsEntityForPeriod(entityType, "2026-07"); }
export async function medsystemsBitrixJulyTotals() { const range = PERIODS["2026-07"]; return bitrixJulyTotals(new URL(webhookBaseUrl()).host, range.start, range.end); }
export async function medsystemsBitrixJulyDealAnalytics(statusFilter: DealStatusFilter = "all", brand: "all" | "medsystems" | "beautysystems" = "all", period: AnalyticsPeriod = "2026-07") {
  const range = PERIODS[period];
  return bitrixDealJulyAnalytics(new URL(webhookBaseUrl()).host, range.start, range.end, statusFilter, brand);
}

export async function medsystemsBitrixLeadChannelFunnel(statusFilter: DealStatusFilter = "all", brand: "all" | "medsystems" | "beautysystems" = "all", period: AnalyticsPeriod = "2026-07") {
  const range = PERIODS[period];
  return bitrixLeadChannelFunnel(new URL(webhookBaseUrl()).host, range.start, range.end, statusFilter, brand);
}

export async function medsystemsBitrixCampaignAttributionDetail(statusFilter: DealStatusFilter = "all", brand: "all" | "medsystems" | "beautysystems" = "all", period: AnalyticsPeriod = "2026-07") {
  const range = PERIODS[period];
  return bitrixCampaignAttributionDetail(new URL(webhookBaseUrl()).host, range.start, range.end, statusFilter, brand);
}

export async function medsystemsUtmReceiptCoverage(brand: "all" | "medsystems" | "beautysystems" = "all", period: AnalyticsPeriod = "2026-07") {
  const range = PERIODS[period];
  return utmReceiptCoverage(new URL(webhookBaseUrl()).host, range.start, range.end, period, brand);
}

export async function medsystemsBitrixOperationsDashboard(statusFilter: DealStatusFilter = "all", brand: "all" | "medsystems" | "beautysystems" = "all", period: AnalyticsPeriod = "2026-07") {
  const range = PERIODS[period];
  return bitrixOperationsDashboard(new URL(webhookBaseUrl()).host, range.start, range.end, statusFilter, brand);
}

export async function medsystemsBitrixRdOpportunityDashboard(input: { startDate: string; endDate: string; filters: RdOpportunityFilters }) {
  const range = validateBusinessDateRange(input.startDate, input.endDate);
  return rdOpportunityManagerDashboard({
    portal: new URL(webhookBaseUrl()).host,
    start: range.start,
    end: range.endExclusive,
    startDate: input.startDate,
    endDate: input.endDate,
    filters: input.filters,
  });
}
