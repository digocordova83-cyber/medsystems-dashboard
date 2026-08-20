import { and, asc, desc, eq, gt, gte, inArray, isNull, lt, notInArray, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  attributionAuditLinks,
  bitrix24Entities,
  bitrix24SyncRuns,
  mediaDailyPerformance,
  type InsertUser,
  rdStationAccounts,
  rdStationContacts,
  rdStationConversionEvents,
  rdStationJulyLeadViews,
  rdStationSyncRuns,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { sha256 } from "./rdstation/crypto";
import { JULY_2026, RD_ACCOUNTS, RD_ACCOUNT_META, type RdAccountKey } from "./rdstation/types";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function ensureRdStationAccounts() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  for (const accountKey of RD_ACCOUNTS) {
    await db.insert(rdStationAccounts).values({ accountKey, displayName: RD_ACCOUNT_META[accountKey].label })
      .onDuplicateKeyUpdate({ set: { displayName: RD_ACCOUNT_META[accountKey].label } });
  }
}

export async function getAccountByKey(accountKey: RdAccountKey) {
  await ensureRdStationAccounts();
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const rows = await db.select().from(rdStationAccounts).where(eq(rdStationAccounts.accountKey, accountKey)).limit(1);
  return rows[0];
}

export async function listIntegrationAccounts() {
  await ensureRdStationAccounts();
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const accounts = await db.select().from(rdStationAccounts).orderBy(asc(rdStationAccounts.accountKey));
  return Promise.all(accounts.map(async account => {
    const [contactCount] = await db.select({ count: sql<number>`count(*)` }).from(rdStationContacts).where(eq(rdStationContacts.accountKey, account.accountKey));
    const [eventCount] = await db.select({ count: sql<number>`count(*)` }).from(rdStationConversionEvents).where(eq(rdStationConversionEvents.accountKey, account.accountKey));
    const [firstJulyQualified] = await db.select({ count: sql<number>`count(*)` }).from(rdStationJulyLeadViews).where(and(
      eq(rdStationJulyLeadViews.accountKey, account.accountKey),
      eq(rdStationJulyLeadViews.viewType, "primeira"),
      eq(rdStationJulyLeadViews.status, "qualificado"),
    ));
    const [lastJulyQualified] = await db.select({ count: sql<number>`count(*)` }).from(rdStationJulyLeadViews).where(and(
      eq(rdStationJulyLeadViews.accountKey, account.accountKey),
      eq(rdStationJulyLeadViews.viewType, "ultima"),
      eq(rdStationJulyLeadViews.status, "qualificado"),
    ));
    const [pending] = await db.select({ count: sql<number>`count(*)` }).from(rdStationContacts)
      .where(and(eq(rdStationContacts.accountKey, account.accountKey), isNull(rdStationContacts.eventsSyncedAt)));
    return {
      accountKey: account.accountKey,
      displayName: account.displayName,
      status: account.status,
      segmentationId: account.segmentationId,
      contactSyncPage: account.contactSyncPage,
      contactSyncTotal: account.contactSyncTotal,
      contactsSyncedAt: account.contactsSyncedAt,
      authorized: Boolean(account.refreshTokenCiphertext),
      tokenExpiresAt: account.tokenExpiresAt,
      authorizedAt: account.authorizedAt,
      lastSyncAt: account.lastSyncAt,
      lastError: account.lastError,
      contactsStored: Number(contactCount?.count ?? 0),
      julyConversionsStored: Number(eventCount?.count ?? 0),
      firstJulyQualified: Number(firstJulyQualified?.count ?? 0),
      lastJulyQualified: Number(lastJulyQualified?.count ?? 0),
      contactsPendingEvents: Number(pending?.count ?? 0),
    };
  }));
}

export async function saveOAuthState(accountKey: RdAccountKey, state: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(rdStationAccounts).set({
    oauthStateHash: sha256(state),
    oauthStateExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
  }).where(eq(rdStationAccounts.accountKey, accountKey));
}

export async function validateAndConsumeOAuthState(accountKey: RdAccountKey, state: string) {
  const account = await getAccountByKey(accountKey);
  const valid = Boolean(account?.oauthStateHash && account.oauthStateExpiresAt && account.oauthStateExpiresAt > new Date() && account.oauthStateHash === sha256(state));
  if (valid) {
    const db = await getDb();
    if (!db) throw new Error("Banco de dados indisponível.");
    await db.update(rdStationAccounts).set({ oauthStateHash: null, oauthStateExpiresAt: null }).where(eq(rdStationAccounts.accountKey, accountKey));
  }
  return valid;
}

export async function saveTokensForAccount(input: {
  accountKey: RdAccountKey;
  accessTokenCiphertext: string;
  refreshTokenCiphertext: string;
  tokenExpiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(rdStationAccounts).set({
    accessTokenCiphertext: input.accessTokenCiphertext,
    refreshTokenCiphertext: input.refreshTokenCiphertext,
    tokenExpiresAt: input.tokenExpiresAt,
    authorizedAt: new Date(),
    status: "pronta",
    lastError: null,
  }).where(eq(rdStationAccounts.accountKey, input.accountKey));
}

export async function setAccountSegmentation(accountKey: RdAccountKey, segmentationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(rdStationAccounts).set({
    segmentationId: segmentationId || null,
    contactSyncPage: 1,
    contactSyncTotal: 0,
    contactsSyncedAt: null,
  }).where(eq(rdStationAccounts.accountKey, accountKey));
}

export async function updateContactSyncProgress(input: {
  accountKey: RdAccountKey;
  nextPage: number;
  total: number;
  completedAt?: Date | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(rdStationAccounts).set({
    contactSyncPage: input.nextPage,
    contactSyncTotal: input.total,
    contactsSyncedAt: input.completedAt ?? null,
  }).where(eq(rdStationAccounts.accountKey, input.accountKey));
}

export async function setAccountSyncStatus(accountKey: RdAccountKey, status: "desconectada" | "pronta" | "sincronizando" | "erro", error: string | null, lastSyncAt?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(rdStationAccounts).set({ status, lastError: error, ...(lastSyncAt ? { lastSyncAt } : {}) }).where(eq(rdStationAccounts.accountKey, accountKey));
}

export async function createSyncRun(accountKey: RdAccountKey, scope: "contatos" | "conversoes") {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const result = await db.insert(rdStationSyncRuns).values({ accountKey, scope, periodStart: JULY_2026.start, periodEnd: JULY_2026.end });
  return { id: Number(result[0].insertId) };
}

function asDate(value: unknown) {
  const date = value ? new Date(String(value)) : null;
  return date && !Number.isNaN(date.valueOf()) ? date : null;
}

export async function upsertContacts(accountKey: RdAccountKey, contacts: Record<string, unknown>[]) {
  const db = await getDb();
  if (!db || !contacts.length) return;
  const values = contacts.filter(contact => contact.uuid).map(contact => ({
    accountKey,
    contactUuid: String(contact.uuid),
    name: contact.name ? String(contact.name) : null,
    email: contact.email ? String(contact.email) : null,
    phone: contact.phone ? String(contact.phone) : null,
    createdAtRd: asDate(contact.created_at),
    lastConversionAt: asDate(contact.last_conversion_date),
    rawPayload: JSON.stringify(contact),
  }));
  if (!values.length) return;
  await db.insert(rdStationContacts).values(values).onDuplicateKeyUpdate({ set: {
    name: sql`values(name)`, email: sql`values(email)`, phone: sql`values(phone)`,
    createdAtRd: sql`values(createdAtRd)`, lastConversionAt: sql`values(lastConversionAt)`, rawPayload: sql`values(rawPayload)`,
  } });
}

export async function getContactsPendingEventSync(accountKey: RdAccountKey, limit: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  return db.select().from(rdStationContacts)
    .where(and(eq(rdStationContacts.accountKey, accountKey), isNull(rdStationContacts.eventsSyncedAt)))
    .orderBy(asc(rdStationContacts.id)).limit(limit);
}

export async function getContactsForEventWindow(accountKey: RdAccountKey, start: Date, end: Date, afterId: number, limit: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  return db.select().from(rdStationContacts)
    .where(and(
      eq(rdStationContacts.accountKey, accountKey),
      gt(rdStationContacts.id, afterId),
      or(
        and(gte(rdStationContacts.createdAtRd, start), lt(rdStationContacts.createdAtRd, end)),
        and(gte(rdStationContacts.lastConversionAt, start), lt(rdStationContacts.lastConversionAt, end)),
      ),
    ))
    .orderBy(asc(rdStationContacts.id))
    .limit(limit);
}

export async function markContactsEventsSynced(ids: number[]) {
  const db = await getDb();
  if (!db || !ids.length) return;
  for (const id of ids) await db.update(rdStationContacts).set({ eventsSyncedAt: new Date() }).where(eq(rdStationContacts.id, id));
}

export async function upsertConversionEvents(accountKey: RdAccountKey, contactUuid: string, events: Record<string, unknown>[]) {
  const db = await getDb();
  if (!db || !events.length) return;
  const values = events.map(event => ({
    accountKey,
    contactUuid,
    eventUuid: String(event.event_uuid ?? event.uuid ?? sha256(JSON.stringify({
      contactUuid,
      timestamp: event.event_timestamp ?? event.created_at,
      type: event.event_type,
      family: event.event_family,
      identifier: event.event_identifier,
      payload: event.payload,
    }))),
    eventType: event.event_type ? String(event.event_type) : null,
    eventFamily: event.event_family ? String(event.event_family) : null,
    eventIdentifier: event.event_identifier ? String(event.event_identifier) : (event.payload && typeof event.payload === "object" && (event.payload as Record<string, unknown>).conversion_identifier ? String((event.payload as Record<string, unknown>).conversion_identifier) : null),
    eventCreatedAt: asDate(event.event_timestamp ?? event.created_at) ?? new Date(),
    rawPayload: JSON.stringify(event),
  }));
  if (!values.length) return;
  await db.insert(rdStationConversionEvents).values(values).onDuplicateKeyUpdate({ set: {
    eventIdentifier: sql`values(eventIdentifier)`, rawPayload: sql`values(rawPayload)`,
  } });
}

export type JulyViewType = "primeira" | "ultima";
export type BitrixEntityType = "lead" | "contact" | "deal";
export type AnalyticsBrand = "all" | "medsystems" | "beautysystems";
export type DealStatusFilter = "all" | "open" | "won" | "lost";
export type AnalyticsPeriod = "2026-07" | "2026-08";

const BITRIX_BRAND_FIELD = "UF_CRM_1683207237";
const BITRIX_BRAND_VALUES = { "1907": "medsystems", "3065": "beautysystems" } as const;
const BITRIX_DISCARD_REASON_FIELD = "UF_CRM_1687285902";
const BITRIX_DISCARD_REASON_VALUES: Record<string, string> = {
  "7429": "Duplicado",
  "2279": "Cliente Desistiu da Compra",
  "2267": "Análise de Crédito Recusada",
  "2281": "Substituição de Cadastro",
  "3453": "Outros",
  "11181": "Mudou a forma de pagamento",
  "3439": "Sem recursos financeiros",
  "2277": "Venda Cancelada",
};
const BITRIX_FINANCIAL_STATUS_FIELD = "UF_CRM_1769707203";
const BITRIX_FINANCIAL_STATUS_VALUES: Record<string, string> = {
  "20391": "Pendente",
  "20393": "Aprovado Medsystems",
  "20397": "Aprovado Parceiro",
  "20395": "Recusada",
  "20399": "Desistência",
};

export function bitrixDealBrand(payload: Record<string, unknown>): Exclude<AnalyticsBrand, "all"> | null {
  const value = String(payload[BITRIX_BRAND_FIELD] ?? "").trim();
  return BITRIX_BRAND_VALUES[value as keyof typeof BITRIX_BRAND_VALUES] ?? null;
}

export const BITRIX_LEAD_PIPELINE_FIELD = "UF_CRM_1739195085";
const BITRIX_LEAD_PIPELINE_BRANDS = {
  "15391": "medsystems",
  "15395": "beautysystems",
} as const satisfies Record<string, Exclude<AnalyticsBrand, "all">>;

export function bitrixLeadPipelineBrand(payload: Record<string, unknown>): Exclude<AnalyticsBrand, "all"> | null {
  const value = String(payload[BITRIX_LEAD_PIPELINE_FIELD] ?? "").trim();
  return BITRIX_LEAD_PIPELINE_BRANDS[value as keyof typeof BITRIX_LEAD_PIPELINE_BRANDS] ?? null;
}

export function bitrixDiscardReason(payload: Record<string, unknown>) {
  const value = String(payload[BITRIX_DISCARD_REASON_FIELD] ?? "").trim();
  return BITRIX_DISCARD_REASON_VALUES[value] ?? null;
}

export function bitrixFinancialStatus(payload: Record<string, unknown>) {
  const value = String(payload[BITRIX_FINANCIAL_STATUS_FIELD] ?? "").trim();
  return BITRIX_FINANCIAL_STATUS_VALUES[value] ?? null;
}

function firstMultiValue(value: unknown) {
  if (!Array.isArray(value) || !value.length) return null;
  const first = value[0];
  if (first && typeof first === "object" && "VALUE" in first) return String((first as { VALUE: unknown }).VALUE ?? "") || null;
  return String(first ?? "") || null;
}

function bitrixDate(value: unknown) {
  const date = value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.valueOf())) throw new Error("O Bitrix24 retornou um registro sem DATE_CREATE válido.");
  return date;
}

export async function upsertBitrixEntities(input: {
  portal: string;
  entityType: BitrixEntityType;
  entities: Record<string, unknown>[];
}) {
  const db = await getDb();
  if (!db || !input.entities.length) return 0;
  const values = input.entities.map(entity => ({
    portal: input.portal,
    entityType: input.entityType,
    bitrixId: Number(entity.ID),
    title: entity.TITLE ? String(entity.TITLE) : null,
    fullName: [entity.NAME, entity.LAST_NAME, entity.SECOND_NAME].filter(Boolean).map(String).join(" ") || null,
    email: firstMultiValue(entity.EMAIL),
    phone: firstMultiValue(entity.PHONE),
    stageOrStatus: entity.STATUS_ID ? String(entity.STATUS_ID) : (entity.STAGE_ID ? String(entity.STAGE_ID) : null),
    createdAtBitrix: bitrixDate(entity.DATE_CREATE),
    updatedAtBitrix: entity.DATE_MODIFY ? bitrixDate(entity.DATE_MODIFY) : null,
    rawPayload: JSON.stringify(entity),
    syncedAt: new Date(),
  })).filter(entity => Number.isInteger(entity.bitrixId) && entity.bitrixId > 0);
  if (!values.length) return 0;
  await db.insert(bitrix24Entities).values(values).onDuplicateKeyUpdate({ set: {
    title: sql`values(title)`, fullName: sql`values(fullName)`, email: sql`values(email)`, phone: sql`values(phone)`,
    stageOrStatus: sql`values(stageOrStatus)`, createdAtBitrix: sql`values(createdAtBitrix)`, updatedAtBitrix: sql`values(updatedAtBitrix)`, rawPayload: sql`values(rawPayload)`, syncedAt: new Date(),
  } });
  return values.length;
}

export async function bitrixReferencedContactIds(input: { portal: string; start: Date; end: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const rows = await db.select({ rawPayload: bitrix24Entities.rawPayload }).from(bitrix24Entities).where(and(
    eq(bitrix24Entities.portal, input.portal),
    inArray(bitrix24Entities.entityType, ["lead", "deal"]),
    gte(bitrix24Entities.createdAtBitrix, input.start),
    lt(bitrix24Entities.createdAtBitrix, input.end),
  ));
  const ids = new Set<number>();
  for (const row of rows) {
    try {
      const contactId = Number((JSON.parse(row.rawPayload) as Record<string, unknown>).CONTACT_ID);
      if (Number.isInteger(contactId) && contactId > 0) ids.add(contactId);
    } catch { /* Registro inválido não produz vínculo. */ }
  }
  return Array.from(ids);
}

export async function reconcileBitrixEntities(input: { portal: string; entityType: BitrixEntityType; periodStart: Date; periodEnd: Date; bitrixIds: number[] }) {
  const db = await getDb();
  if (!db || !input.bitrixIds.length) return 0;
  const result = await db.delete(bitrix24Entities).where(and(
    eq(bitrix24Entities.portal, input.portal),
    eq(bitrix24Entities.entityType, input.entityType),
    gte(bitrix24Entities.createdAtBitrix, input.periodStart),
    lt(bitrix24Entities.createdAtBitrix, input.periodEnd),
    notInArray(bitrix24Entities.bitrixId, input.bitrixIds),
  ));
  return Number(result[0].affectedRows ?? 0);
}

export async function reconcileAttributionAuditLinks(input: { brand: Exclude<AnalyticsBrand, "all">; bitrixDealIds: number[] }) {
  const db = await getDb();
  if (!db || !input.bitrixDealIds.length) return 0;
  const result = await db.delete(attributionAuditLinks).where(and(
    eq(attributionAuditLinks.brand, input.brand),
    notInArray(attributionAuditLinks.bitrixDealId, input.bitrixDealIds),
  ));
  return Number(result[0].affectedRows ?? 0);
}

export async function startBitrixSyncRun(portal: string, entityType: BitrixEntityType, periodStart: Date, periodEnd: Date) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const result = await db.insert(bitrix24SyncRuns).values({ portal, entityType, periodStart, periodEnd });
  return Number(result[0].insertId);
}

export async function finishBitrixSyncRun(id: number, importedCount: number, errorMessage?: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.update(bitrix24SyncRuns).set({ importedCount, completedAt: new Date(), errorMessage: errorMessage ?? null }).where(eq(bitrix24SyncRuns.id, id));
}

export async function bitrixJulyTotals(portal: string, start: Date, end: Date) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const rows = await db.select({ entityType: bitrix24Entities.entityType, count: sql<number>`count(*)` }).from(bitrix24Entities)
    .where(and(eq(bitrix24Entities.portal, portal), gte(bitrix24Entities.createdAtBitrix, start), lt(bitrix24Entities.createdAtBitrix, end)))
    .groupBy(bitrix24Entities.entityType);
  return Object.fromEntries(rows.map(row => [row.entityType, Number(row.count)])) as Partial<Record<BitrixEntityType, number>>;
}

const bitrixSourceLabels: Record<string, string> = {
  CALL: "Chamada",
  "68": "Social",
  "69": "Tráfego orgânico",
  "70": "Tráfego pago",
  "71": "Outros",
  "106": "Atendimento WF4",
  UC_45K0VX: "Evento",
};

const lostStageLabels: Record<string, string> = {
  "C42:LOSE": "Pipeline C42 — Negócio perdido",
  "C44:LOSE": "Pipeline C44 — Negócio perdido",
  "C57:LOSE": "Pipeline C57 — Negócio perdido",
};

export function utmChannelLabel(value: unknown) {
  const source = cleanAuditString(value)?.toLowerCase() ?? "";
  if (source === "google" || source.includes("google")) return "Google Ads";
  if (source === "facebook" || source === "fb" || source === "meta" || source.includes("facebook") || source.includes("meta")) return "Meta Ads";
  return "Não identificado";
}

export function rdCampaignBrandHint(value: unknown): Exclude<AnalyticsBrand, "all"> | null {
  const campaign = cleanAuditString(value)?.toLowerCase() ?? "";
  if (!campaign) return null;
  if (/(^|[^a-z0-9])(bts|beautysystems)([^a-z0-9]|$)/.test(campaign)) return "beautysystems";
  if (/(^|[^a-z0-9])(medical|medsystems|med)([^a-z0-9]|$)|(^|[^a-z0-9])ms_/.test(campaign)) return "medsystems";
  return null;
}

function cleanAuditString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized && !["null", "undefined"].includes(normalized.toLowerCase()) ? normalized : null;
}

function rdTrafficSourceParams(...candidates: unknown[]) {
  for (const candidate of candidates) {
    const raw = cleanAuditString(candidate);
    if (!raw) continue;
    try {
      const decoded = raw.startsWith("encoded_")
        ? Buffer.from(raw.slice("encoded_".length), "base64").toString("utf8")
        : raw;
      const parsed = JSON.parse(decoded) as Record<string, unknown>;
      const sessions = [parsed.current_session, parsed.first_session, parsed];
      for (const session of sessions) {
        const value = typeof session === "object" && session !== null
          ? cleanAuditString((session as Record<string, unknown>).value)
          : cleanAuditString(session);
        if (value && value.includes("utm_")) return new URLSearchParams(value.replace(/^\?/, ""));
      }
    } catch {
      try {
        if (raw.includes("utm_")) return new URLSearchParams(raw.replace(/^\?/, ""));
      } catch {
        // Mantém a extração sem evidência quando o formato não é legível.
      }
    }
  }
  return null;
}

export function rdEventUtmValues(rawPayload: string) {
  try {
    const event = JSON.parse(rawPayload) as { payload?: Record<string, unknown> };
    const payload = event.payload ?? {};
    const landingPage = cleanAuditString(payload.cf_landing_page);
    const params = landingPage ? new URL(landingPage).searchParams : null;
    const trafficParams = rdTrafficSourceParams(payload.traffic_source, payload.conversion_origin);
    return {
      utmSource: cleanAuditString(payload.cf_utm_source_real ?? payload.cf_utm_source ?? trafficParams?.get("utm_source") ?? params?.get("utm_source")),
      utmMedium: cleanAuditString(payload.cf_utm_medium_real ?? payload.cf_utm_medium ?? trafficParams?.get("utm_medium") ?? params?.get("utm_medium")),
      utmCampaign: cleanAuditString(payload.cf_utm_campaign_real ?? payload.cf_utm_campaign ?? trafficParams?.get("utm_campaign") ?? params?.get("utm_campaign")),
      utmContent: cleanAuditString(payload.cf_utm_content_real ?? payload.cf_utm_content ?? trafficParams?.get("utm_content") ?? params?.get("utm_content")),
      utmTerm: cleanAuditString(payload.cf_utm_term_real ?? payload.cf_utm_term ?? trafficParams?.get("utm_term") ?? params?.get("utm_term")),
      mediaCampaignId: cleanAuditString(trafficParams?.get("utm_id") ?? params?.get("utm_id")),
    };
  } catch {
    return { utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, utmTerm: null, mediaCampaignId: null };
  }
}

export async function getRdUtmContactUuids(accountKey: RdAccountKey, start: Date, end: Date) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [events, contacts] = await Promise.all([
    db.select({ contactUuid: rdStationConversionEvents.contactUuid, rawPayload: rdStationConversionEvents.rawPayload })
      .from(rdStationConversionEvents)
      .where(and(eq(rdStationConversionEvents.accountKey, accountKey), gte(rdStationConversionEvents.eventCreatedAt, start), lt(rdStationConversionEvents.eventCreatedAt, end))),
    db.select({ contactUuid: rdStationContacts.contactUuid, phone: rdStationContacts.phone })
      .from(rdStationContacts)
      .where(eq(rdStationContacts.accountKey, accountKey)),
  ]);
  const phoneByContact = new Map(contacts.map(contact => [contact.contactUuid, contact.phone]));
  return Array.from(new Set(events.filter(event => Boolean(rdEventUtmValues(event.rawPayload).utmSource)).map(event => event.contactUuid)))
    .filter(contactUuid => !phoneByContact.get(contactUuid));
}

export function normalizeIdentityPhone(value: string | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return null;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits.length >= 12 && digits.length <= 13 ? digits : null;
}

export async function rdUtmPhoneMatchFlow(brands: readonly Exclude<AnalyticsBrand, "all">[], start: Date, end: Date) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [events, rdContacts, bitrixContacts] = await Promise.all([
    db.select({ accountKey: rdStationConversionEvents.accountKey, contactUuid: rdStationConversionEvents.contactUuid, rawPayload: rdStationConversionEvents.rawPayload })
      .from(rdStationConversionEvents)
      .where(and(inArray(rdStationConversionEvents.accountKey, brands), gte(rdStationConversionEvents.eventCreatedAt, start), lt(rdStationConversionEvents.eventCreatedAt, end))),
    db.select({ accountKey: rdStationContacts.accountKey, contactUuid: rdStationContacts.contactUuid, phone: rdStationContacts.phone })
      .from(rdStationContacts)
      .where(inArray(rdStationContacts.accountKey, brands)),
    db.select({ phone: bitrix24Entities.phone })
      .from(bitrix24Entities)
      .where(and(eq(bitrix24Entities.portal, "medsystems.bitrix24.com.br"), eq(bitrix24Entities.entityType, "contact"))),
  ]);
  const rdPhoneByContact = new Map(rdContacts.map(contact => [`${contact.accountKey}:${contact.contactUuid}`, normalizeIdentityPhone(contact.phone)]));
  const utmContactKeys = new Set(events.filter(event => Boolean(rdEventUtmValues(event.rawPayload).utmSource)).map(event => `${event.accountKey}:${event.contactUuid}`));
  const rdByBrandPhone = new Map<string, number>();
  for (const key of Array.from(utmContactKeys)) {
    const phone = rdPhoneByContact.get(key);
    if (!phone) continue;
    const [brand] = key.split(":", 1) as [Exclude<AnalyticsBrand, "all">];
    const lookup = `${brand}:${phone}`;
    rdByBrandPhone.set(lookup, (rdByBrandPhone.get(lookup) ?? 0) + 1);
  }
  const bitrixPhoneCounts = new Map<string, number>();
  for (const contact of bitrixContacts) {
    const phone = normalizeIdentityPhone(contact.phone);
    if (phone) bitrixPhoneCounts.set(phone, (bitrixPhoneCounts.get(phone) ?? 0) + 1);
  }
  const empty = () => ({ rdUtmContactsWithPhone: 0, uniqueRdPhones: 0, ambiguousRdPhones: 0, bitrixContactMatches: 0, ambiguousBitrixPhones: 0 });
  const result = { medsystems: empty(), beautysystems: empty() };
  for (const [lookup, count] of Array.from(rdByBrandPhone.entries())) {
    const [brand, phone] = lookup.split(":", 2) as [Exclude<AnalyticsBrand, "all">, string];
    result[brand].rdUtmContactsWithPhone += count;
    if (count !== 1) { result[brand].ambiguousRdPhones += count; continue; }
    result[brand].uniqueRdPhones += 1;
    const bitrixCount = bitrixPhoneCounts.get(phone) ?? 0;
    if (bitrixCount === 1) result[brand].bitrixContactMatches += 1;
    else if (bitrixCount > 1) result[brand].ambiguousBitrixPhones += 1;
  }
  return result;
}

export function rdEventAttribution(rawPayload: string) {
  const { utmSource, utmCampaign, mediaCampaignId } = rdEventUtmValues(rawPayload);
  return { utmSource, utmCampaign, mediaCampaignId };
}

export function dealStatusFromSemantic(value: unknown): Exclude<DealStatusFilter, "all"> {
  const semantic = String(value ?? "");
  return semantic === "S" ? "won" : semantic === "F" ? "lost" : "open";
}

export async function bitrixDealJulyAnalytics(portal: string, start: Date, end: Date, statusFilter: DealStatusFilter = "all", brand: AnalyticsBrand = "all") {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const rows = await db.select({ stageOrStatus: bitrix24Entities.stageOrStatus, rawPayload: bitrix24Entities.rawPayload })
    .from(bitrix24Entities)
    .where(and(eq(bitrix24Entities.portal, portal), eq(bitrix24Entities.entityType, "deal"), gte(bitrix24Entities.createdAtBitrix, start), lt(bitrix24Entities.createdAtBitrix, end)));
  const sources = new Map<string, { count: number; value: number }>();
  const losses = new Map<string, { count: number; value: number; withObservation: number }>();
  const discards = new Map<string, { count: number; value: number }>();
  const discardChannels = new Map<string, { count: number; value: number }>();
  const financialStatuses = new Map<string, { count: number; value: number }>();
  const utmSources = new Map<string, { count: number; value: number }>();
  let won = 0;
  let lost = 0;
  let closed = 0;
  let totalValue = 0;
  let wonValue = 0;
  let lostValue = 0;
  let lostWithObservation = 0;
  let total = 0;

  for (const row of rows) {
    const payload = JSON.parse(row.rawPayload) as Record<string, unknown>;
    const dealBrand = bitrixDealBrand(payload);
    if (!dealBrand || (brand !== "all" && dealBrand !== brand)) continue;
    const semantic = String(payload.STAGE_SEMANTIC_ID ?? "");
    const dealStatus = dealStatusFromSemantic(semantic);
    if (statusFilter !== "all" && dealStatus !== statusFilter) continue;
    total += 1;
    const sourceId = String(payload.SOURCE_ID ?? "");
    const value = Number(payload.OPPORTUNITY ?? 0) || 0;
    const discardReason = bitrixDiscardReason(payload);
    if (discardReason) {
      const discard = discards.get(discardReason) ?? { count: 0, value: 0 };
      discard.count += 1;
      discard.value += value;
      discards.set(discardReason, discard);
      const discardChannel = utmChannelLabel(payload.UTM_SOURCE);
      if (discardChannel !== "Não identificado") {
        const channel = discardChannels.get(discardChannel) ?? { count: 0, value: 0 };
        channel.count += 1;
        channel.value += value;
        discardChannels.set(discardChannel, channel);
      }
    }
    const financialStatus = bitrixFinancialStatus(payload);
    if (financialStatus) {
      const status = financialStatuses.get(financialStatus) ?? { count: 0, value: 0 };
      status.count += 1;
      status.value += value;
      financialStatuses.set(financialStatus, status);
    }
    const hasObservation = Boolean(String(payload.COMMENTS ?? "").trim());
    const sourceLabel = bitrixSourceLabels[sourceId] ?? (sourceId ? `Código ${sourceId}` : "Não informado");
    const source = sources.get(sourceLabel) ?? { count: 0, value: 0 };
    source.count += 1;
    source.value += value;
    sources.set(sourceLabel, source);
    const utmLabel = utmChannelLabel(payload.UTM_SOURCE);
    const utm = utmSources.get(utmLabel) ?? { count: 0, value: 0 };
    utm.count += 1;
    utm.value += value;
    utmSources.set(utmLabel, utm);
    totalValue += value;
    if (payload.CLOSED === "Y") closed += 1;
    if (semantic === "S") { won += 1; wonValue += value; }
    if (semantic === "F") {
      lost += 1;
      lostValue += value;
      if (hasObservation) lostWithObservation += 1;
      const lossLabel = lostStageLabels[row.stageOrStatus ?? ""] ?? `${row.stageOrStatus ?? "Sem etapa"} — Negócio perdido`;
      const loss = losses.get(lossLabel) ?? { count: 0, value: 0, withObservation: 0 };
      loss.count += 1;
      loss.value += value;
      if (hasObservation) loss.withObservation += 1;
      losses.set(lossLabel, loss);
    }
  }

  const toBreakdown = (entries: Map<string, { count: number; value: number }>) => Array.from(entries, ([label, item]) => ({ label, ...item })).sort((a, b) => b.count - a.count);
  return {
    total,
    open: total - closed,
    closed,
    won,
    lost,
    totalValue,
    wonValue,
    lostValue,
    wonRateOfClosed: closed ? (won / closed) * 100 : 0,
    averageWonTicket: won ? wonValue / won : 0,
    lostWithObservation,
    sources: toBreakdown(sources),
    utmSources: toBreakdown(utmSources),
    losses: Array.from(losses, ([label, item]) => ({ label, ...item })).sort((a, b) => b.count - a.count),
    discards: toBreakdown(discards),
    discardChannels: toBreakdown(discardChannels),
    financialStatuses: toBreakdown(financialStatuses),
  };
}

export async function bitrixOperationsDashboard(portal: string, start: Date, end: Date, statusFilter: DealStatusFilter = "all", brand: AnalyticsBrand = "all") {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [leadRows, contactRows, dealRows, dealAnalytics] = await Promise.all([
    db.select({ bitrixId: bitrix24Entities.bitrixId, createdAtBitrix: bitrix24Entities.createdAtBitrix, rawPayload: bitrix24Entities.rawPayload })
      .from(bitrix24Entities).where(and(eq(bitrix24Entities.portal, portal), eq(bitrix24Entities.entityType, "lead"), gte(bitrix24Entities.createdAtBitrix, start), lt(bitrix24Entities.createdAtBitrix, end))),
    db.select({ bitrixId: bitrix24Entities.bitrixId, createdAtBitrix: bitrix24Entities.createdAtBitrix })
      .from(bitrix24Entities).where(and(eq(bitrix24Entities.portal, portal), eq(bitrix24Entities.entityType, "contact"), gte(bitrix24Entities.createdAtBitrix, start), lt(bitrix24Entities.createdAtBitrix, end))),
    db.select({ rawPayload: bitrix24Entities.rawPayload })
      .from(bitrix24Entities).where(and(eq(bitrix24Entities.portal, portal), eq(bitrix24Entities.entityType, "deal"), gte(bitrix24Entities.createdAtBitrix, start), lt(bitrix24Entities.createdAtBitrix, end))),
    bitrixDealJulyAnalytics(portal, start, end, statusFilter, brand),
  ]);
  const parsedLeadRows = leadRows.map(lead => {
    try {
      const payload = JSON.parse(lead.rawPayload) as Record<string, unknown>;
      return { ...lead, payload, pipelineBrand: bitrixLeadPipelineBrand(payload) };
    } catch {
      return { ...lead, payload: null, pipelineBrand: null };
    }
  });
  const scopedLeadRows = brand === "all" ? parsedLeadRows : parsedLeadRows.filter(lead => lead.pipelineBrand === brand);
  const leadsByDay = new Map<string, number>();
  const leadOrigins = new Map<string, number>();
  const leadChannels = new Map<string, number>();
  let leadsWithSource = 0;
  let leadsWithUtm = 0;
  for (const lead of scopedLeadRows) {
    const day = lead.createdAtBitrix.toISOString().slice(0, 10);
    leadsByDay.set(day, (leadsByDay.get(day) ?? 0) + 1);
    if (lead.payload) {
      const payload = lead.payload;
      const sourceId = String(payload.SOURCE_ID ?? "");
      const sourceLabel = bitrixSourceLabels[sourceId] ?? (sourceId ? `Código ${sourceId}` : "Não informado");
      leadOrigins.set(sourceLabel, (leadOrigins.get(sourceLabel) ?? 0) + 1);
      if (sourceId) leadsWithSource += 1;
      const channel = utmChannelLabel(payload.UTM_SOURCE);
      leadChannels.set(channel, (leadChannels.get(channel) ?? 0) + 1);
      if (cleanAuditString(payload.UTM_SOURCE)) leadsWithUtm += 1;
    } else {
      leadOrigins.set("Não identificado", (leadOrigins.get("Não identificado") ?? 0) + 1);
      leadChannels.set("Não identificado", (leadChannels.get("Não identificado") ?? 0) + 1);
    }
  }
  let dealsWithLeadId = 0;
  let dealsLinkedToLeadInPeriod = 0;
  let dealsWithoutLeadId = 0;
  const leadIds = new Set(leadRows.map(row => String(row.bitrixId)));
  for (const deal of dealRows) {
    try {
      const payload = JSON.parse(deal.rawPayload) as Record<string, unknown>;
      const dealBrand = bitrixDealBrand(payload);
      if (!dealBrand || (brand !== "all" && dealBrand !== brand)) continue;
      if (statusFilter !== "all" && dealStatusFromSemantic(payload.STAGE_SEMANTIC_ID) !== statusFilter) continue;
      const leadId = cleanAuditString(payload.LEAD_ID);
      if (!leadId) { dealsWithoutLeadId += 1; continue; }
      dealsWithLeadId += 1;
      if (leadIds.has(leadId)) dealsLinkedToLeadInPeriod += 1;
    } catch {
      dealsWithoutLeadId += 1;
    }
  }
  const breakdown = (map: Map<string, number>) => Array.from(map, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  return {
    leadBrandScopeAvailable: true,
    contactsScopeAvailable: brand === "all",
    leadPipelineScope: {
      field: BITRIX_LEAD_PIPELINE_FIELD,
      method: brand === "all" ? "Todos os pipelines" : brand === "medsystems" ? "Pipeline Medsystems" : "Pipeline Negócios e Redes",
      leadsWithoutRecognizedPipeline: parsedLeadRows.filter(lead => !lead.pipelineBrand).length,
    },
    leads: {
      total: scopedLeadRows.length,
      contactsCreated: brand === "all" ? contactRows.length : 0,
      withSource: leadsWithSource,
      withUtm: leadsWithUtm,
      byDay: Array.from(leadsByDay, ([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
      origins: breakdown(leadOrigins),
      channels: breakdown(leadChannels),
    },
    deals: dealAnalytics,
    crossings: { dealsWithLeadId, dealsLinkedToLeadInPeriod, dealsWithoutLeadId },
  };
}

export async function bitrixLeadChannelFunnel(portal: string, start: Date, end: Date, statusFilter: DealStatusFilter = "all", brand: AnalyticsBrand = "all") {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [leadRows, dealRows] = await Promise.all([
    db.select({ bitrixId: bitrix24Entities.bitrixId, rawPayload: bitrix24Entities.rawPayload }).from(bitrix24Entities).where(and(eq(bitrix24Entities.portal, portal), eq(bitrix24Entities.entityType, "lead"), gte(bitrix24Entities.createdAtBitrix, start), lt(bitrix24Entities.createdAtBitrix, end))),
    db.select({ rawPayload: bitrix24Entities.rawPayload }).from(bitrix24Entities).where(and(eq(bitrix24Entities.portal, portal), eq(bitrix24Entities.entityType, "deal"), gte(bitrix24Entities.createdAtBitrix, start), lt(bitrix24Entities.createdAtBitrix, end))),
  ]);
  const leadChannels = new Map<string, string>();
  const rows = new Map<string, { leadsReceived: number; deals: number; won: number; lost: number; discards: number }>();
  const add = (channel: string) => {
    const existing = rows.get(channel) ?? { leadsReceived: 0, deals: 0, won: 0, lost: 0, discards: 0 };
    rows.set(channel, existing);
    return existing;
  };
  for (const lead of leadRows) {
    try {
      const payload = JSON.parse(lead.rawPayload) as Record<string, unknown>;
      const channel = utmChannelLabel(payload.UTM_SOURCE);
      leadChannels.set(String(lead.bitrixId), channel);
      add(channel).leadsReceived += 1;
    } catch {
      leadChannels.set(String(lead.bitrixId), "Não identificado");
      add("Não identificado").leadsReceived += 1;
    }
  }
  let linkedDeals = 0;
  let unlinkedDeals = 0;
  const unlinked = { leadsReceived: 0, deals: 0, won: 0, lost: 0, discards: 0 };
  for (const deal of dealRows) {
    try {
      const payload = JSON.parse(deal.rawPayload) as Record<string, unknown>;
      const dealBrand = bitrixDealBrand(payload);
      if (!dealBrand || (brand !== "all" && dealBrand !== brand)) continue;
      const status = dealStatusFromSemantic(payload.STAGE_SEMANTIC_ID);
      if (statusFilter !== "all" && status !== statusFilter) continue;
      const leadId = cleanAuditString(payload.LEAD_ID);
      const channel = leadId ? leadChannels.get(leadId) : null;
      if (!channel) {
        unlinkedDeals += 1;
        unlinked.deals += 1;
        if (status === "won") unlinked.won += 1;
        if (status === "lost") unlinked.lost += 1;
        if (bitrixDiscardReason(payload)) unlinked.discards += 1;
        continue;
      }
      const row = add(channel);
      linkedDeals += 1;
      row.deals += 1;
      if (status === "won") row.won += 1;
      if (status === "lost") row.lost += 1;
      if (bitrixDiscardReason(payload)) row.discards += 1;
    } catch {
      unlinkedDeals += 1;
      unlinked.deals += 1;
    }
  }
  if (unlinked.deals) rows.set("Não identificado — negócio sem LEAD_ID vinculável", unlinked);
  return {
    leadBrandScopeAvailable: brand === "all",
    linkedDeals,
    unlinkedDeals,
    rows: Array.from(rows, ([channel, row]) => ({ channel, ...row, leadsReceived: channel.includes("sem LEAD_ID vinculável") ? null : brand === "all" ? row.leadsReceived : null })).sort((a, b) => b.deals - a.deals || (b.leadsReceived ?? 0) - (a.leadsReceived ?? 0)),
  };
}

type UtmCoverage = { total: number; withSource: number; withCampaign: number; withContent: number; withTerm: number };

export function normalizeIdentityEmail(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized.includes("@") ? normalized : null;
}

export async function utmReceiptCoverage(portal: string, start: Date, end: Date, period: AnalyticsPeriod, brand: AnalyticsBrand = "all") {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [bitrixRows, rdRows, mediaRows, bitrixContacts, rdContacts, rdLeadViews] = await Promise.all([
    db.select({ rawPayload: bitrix24Entities.rawPayload }).from(bitrix24Entities).where(and(eq(bitrix24Entities.portal, portal), eq(bitrix24Entities.entityType, "lead"), gte(bitrix24Entities.createdAtBitrix, start), lt(bitrix24Entities.createdAtBitrix, end))),
    db.select({ accountKey: rdStationConversionEvents.accountKey, contactUuid: rdStationConversionEvents.contactUuid, rawPayload: rdStationConversionEvents.rawPayload }).from(rdStationConversionEvents).where(and(gte(rdStationConversionEvents.eventCreatedAt, start), lt(rdStationConversionEvents.eventCreatedAt, end), ...(brand === "all" ? [] : [eq(rdStationConversionEvents.accountKey, brand)]))),
    db.select({ brand: mediaDailyPerformance.brand, campaignName: mediaDailyPerformance.campaignName }).from(mediaDailyPerformance).where(and(eq(mediaDailyPerformance.recordLevel, "campaign"), gte(mediaDailyPerformance.reportDate, start), lt(mediaDailyPerformance.reportDate, end), ...(brand === "all" ? [] : [eq(mediaDailyPerformance.brand, brand)]))),
    db.select({ bitrixId: bitrix24Entities.bitrixId, email: bitrix24Entities.email }).from(bitrix24Entities).where(and(eq(bitrix24Entities.portal, portal), eq(bitrix24Entities.entityType, "contact"))),
    db.select({ accountKey: rdStationContacts.accountKey, contactUuid: rdStationContacts.contactUuid, email: rdStationContacts.email }).from(rdStationContacts),
    period === "2026-07" ? db.select({ accountKey: rdStationJulyLeadViews.accountKey, contactUuid: rdStationJulyLeadViews.contactUuid, sourceBucket: rdStationJulyLeadViews.sourceBucket }).from(rdStationJulyLeadViews).where(and(eq(rdStationJulyLeadViews.viewType, "primeira"), ...(brand === "all" ? [] : [eq(rdStationJulyLeadViews.accountKey, brand)]))) : Promise.resolve([]),
  ]);
  const createCoverage = (): UtmCoverage => ({ total: 0, withSource: 0, withCampaign: 0, withContent: 0, withTerm: 0 });
  const addCoverage = (target: UtmCoverage, values: { utmSource: string | null; utmCampaign: string | null; utmContent: string | null; utmTerm: string | null }) => {
    target.total += 1;
    if (values.utmSource) target.withSource += 1;
    if (values.utmCampaign) target.withCampaign += 1;
    if (values.utmContent) target.withContent += 1;
    if (values.utmTerm) target.withTerm += 1;
  };
  const mediaCampaigns = new Map<string, Set<string>>();
  for (const media of mediaRows) {
    const key = cleanAuditString(media.campaignName)?.toLowerCase();
    if (!key) continue;
    const brands = mediaCampaigns.get(key) ?? new Set<string>();
    brands.add(media.brand);
    mediaCampaigns.set(key, brands);
  }
  const bitrix = createCoverage();
  const contactEmailById = new Map(bitrixContacts.map(contact => [String(contact.bitrixId), normalizeIdentityEmail(contact.email)]));
  const rdIdentityByEmail = new Map<string, { brand: Exclude<AnalyticsBrand, "all">; contactUuid: string; count: number }>();
  for (const contact of rdContacts) {
    const email = normalizeIdentityEmail(contact.email);
    if (!email) continue;
    const existing = rdIdentityByEmail.get(email);
    if (existing) existing.count += 1;
    else rdIdentityByEmail.set(email, { brand: contact.accountKey, contactUuid: contact.contactUuid, count: 1 });
  }
  const identity = { email: 0, phone: 0, cpf: 0, ambiguous: 0, unmatched: 0 };
  const rdEventsByContact = new Map<string, ReturnType<typeof rdEventUtmValues>>();
  for (const row of rdRows) {
    const key = `${row.accountKey}:${row.contactUuid}`;
    if (!rdEventsByContact.has(key)) rdEventsByContact.set(key, rdEventUtmValues(row.rawPayload));
  }
  const rdOriginByContact = new Map<string, string>();
  for (const view of rdLeadViews) {
    const key = `${view.accountKey}:${view.contactUuid}`;
    if (!rdOriginByContact.has(key) && view.sourceBucket) rdOriginByContact.set(key, view.sourceBucket);
  }
  const rdEnrichment = { matchedIdentity: 0, withRdEvent: 0, withUtm: 0, withoutRdEvent: 0, origins: new Map<string, number>() };
  const enrichedUtm = createCoverage();
  for (const row of bitrixRows) {
    try {
      const payload = JSON.parse(row.rawPayload) as Record<string, unknown>;
      const email = contactEmailById.get(String(payload.CONTACT_ID ?? ""));
      const candidate = email ? rdIdentityByEmail.get(email) : null;
      const matchedBrand = candidate?.count === 1 ? candidate.brand : null;
      if (brand !== "all" && matchedBrand !== brand) continue;
      if (candidate && !matchedBrand) identity.ambiguous += 1;
      if (matchedBrand && candidate) {
        identity.email += 1;
        rdEnrichment.matchedIdentity += 1;
        const key = `${matchedBrand}:${candidate.contactUuid}`;
        const eventUtm = rdEventsByContact.get(key);
        if (eventUtm) {
          rdEnrichment.withRdEvent += 1;
          addCoverage(enrichedUtm, eventUtm);
          if (eventUtm.utmSource || eventUtm.utmCampaign || eventUtm.utmContent || eventUtm.utmTerm) rdEnrichment.withUtm += 1;
          const origin = rdOriginByContact.get(key) ?? eventUtm.utmSource ?? "Não identificado";
          rdEnrichment.origins.set(origin, (rdEnrichment.origins.get(origin) ?? 0) + 1);
        } else rdEnrichment.withoutRdEvent += 1;
      }
      else identity.unmatched += 1;
      addCoverage(bitrix, {
        utmSource: cleanAuditString(payload.UTM_SOURCE),
        utmCampaign: cleanAuditString(payload.UTM_CAMPAIGN),
        utmContent: cleanAuditString(payload.UTM_CONTENT),
        utmTerm: cleanAuditString(payload.UTM_TERM),
      });
    } catch {
      identity.unmatched += 1;
      if (brand === "all") bitrix.total += 1;
    }
  }
  const rd = createCoverage();
  const campaigns = new Map<string, { campaign: string; brand: Exclude<AnalyticsBrand, "all">; rdEvents: number; mediaCampaignFound: boolean }>();
  for (const row of rdRows) {
    const values = rdEventUtmValues(row.rawPayload);
    addCoverage(rd, values);
    if (!values.utmCampaign) continue;
    const key = `${row.accountKey}:${values.utmCampaign.toLowerCase()}`;
    const existing = campaigns.get(key) ?? {
      campaign: values.utmCampaign,
      brand: row.accountKey,
      rdEvents: 0,
      mediaCampaignFound: mediaCampaigns.get(values.utmCampaign.toLowerCase())?.has(row.accountKey) ?? false,
    };
    existing.rdEvents += 1;
    campaigns.set(key, existing);
  }
  return {
    period,
    bitrix: { available: brand === "all" || bitrix.total > 0, reason: brand !== "all" && !bitrix.total ? "Nenhum lead Bitrix24 foi vinculado de forma única à marca selecionada por e-mail." : null, brandScopeAvailable: brand === "all" || bitrix.total > 0, identity, ...bitrix },
    rd: { available: rdRows.length > 0, reason: rdRows.length ? null : "Não há eventos de conversão RD Station disponíveis no recorte selecionado.", ...rd },
    bitrixRdEnrichment: {
      available: rdRows.length > 0,
      reason: rdRows.length ? null : "Não há eventos de conversão RD Station disponíveis no recorte selecionado.",
      matchedIdentity: rdEnrichment.matchedIdentity,
      withRdEvent: rdEnrichment.withRdEvent,
      withUtm: rdEnrichment.withUtm,
      withoutRdEvent: rdEnrichment.withoutRdEvent,
      utm: enrichedUtm,
      origins: Array.from(rdEnrichment.origins, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    },
    rdCampaigns: Array.from(campaigns.values()).sort((a, b) => b.rdEvents - a.rdEvents || a.campaign.localeCompare(b.campaign)),
  };
}

type CampaignTrackingCandidate = { campaignId: string; campaignName: string; brand: Exclude<AnalyticsBrand, "all">; platform: "google_ads" | "meta_ads"; matchLevel: "campaign" | "ad_group" | "ad"; matchMethod: "exact" | "creative_key" | "url_utm" };

export function normalizeCreativeKey(value: unknown) {
  const normalized = cleanAuditString(value)?.toLowerCase();
  if (!normalized) return null;
  return normalized.replace(/^ad\d{2}-/, "").replace(/-\d{2}$/, "") || null;
}

export function campaignTrackingValue(payload: Record<string, unknown>) {
  const campaign = cleanAuditString(payload.UTM_CAMPAIGN);
  if (campaign) return { field: "UTM campaign", value: campaign };
  const term = cleanAuditString(payload.UTM_TERM);
  if (term) return { field: "UTM term", value: term };
  const content = cleanAuditString(payload.UTM_CONTENT);
  if (content) return { field: "UTM content", value: content };
  return null;
}

export async function bitrixCampaignAttributionDetail(portal: string, start: Date, end: Date, statusFilter: DealStatusFilter = "all", brand: AnalyticsBrand = "all") {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [leadRows, dealRows, mediaRows] = await Promise.all([
    db.select({ bitrixId: bitrix24Entities.bitrixId, rawPayload: bitrix24Entities.rawPayload }).from(bitrix24Entities).where(and(eq(bitrix24Entities.portal, portal), eq(bitrix24Entities.entityType, "lead"), gte(bitrix24Entities.createdAtBitrix, start), lt(bitrix24Entities.createdAtBitrix, end))),
    db.select({ rawPayload: bitrix24Entities.rawPayload }).from(bitrix24Entities).where(and(eq(bitrix24Entities.portal, portal), eq(bitrix24Entities.entityType, "deal"), gte(bitrix24Entities.createdAtBitrix, start), lt(bitrix24Entities.createdAtBitrix, end))),
    db.select({ platform: mediaDailyPerformance.platform, brand: mediaDailyPerformance.brand, campaignId: mediaDailyPerformance.campaignId, campaignName: mediaDailyPerformance.campaignName, adGroupName: mediaDailyPerformance.adGroupName, adName: mediaDailyPerformance.adName, rawPayload: mediaDailyPerformance.rawPayload, recordLevel: mediaDailyPerformance.recordLevel }).from(mediaDailyPerformance).where(and(gte(mediaDailyPerformance.reportDate, start), lt(mediaDailyPerformance.reportDate, end), ...(brand === "all" ? [] : [eq(mediaDailyPerformance.brand, brand)]))),
  ]);
  const exactCampaignLabels = new Map<string, CampaignTrackingCandidate | null>();
  const creativeKeyLabels = new Map<string, CampaignTrackingCandidate | null>();
  const register = (target: Map<string, CampaignTrackingCandidate | null>, value: string | null, candidate: CampaignTrackingCandidate) => {
    const normalized = cleanAuditString(value)?.toLowerCase();
    if (!normalized) return;
    const existing = target.get(normalized);
    if (!existing) { target.set(normalized, candidate); return; }
    if (existing.campaignId !== candidate.campaignId || existing.platform !== candidate.platform || existing.brand !== candidate.brand) target.set(normalized, null);
  };
  for (const row of mediaRows) {
    const base = { campaignId: row.campaignId, campaignName: row.campaignName || row.campaignId, brand: row.brand, platform: row.platform };
    register(exactCampaignLabels, row.campaignName, { ...base, matchLevel: "campaign", matchMethod: "exact" });
    register(exactCampaignLabels, row.adGroupName, { ...base, matchLevel: "ad_group", matchMethod: "exact" });
    register(exactCampaignLabels, row.adName, { ...base, matchLevel: "ad", matchMethod: "exact" });
    const creativeKey = normalizeCreativeKey(row.adName);
    if (creativeKey) {
      const existing = creativeKeyLabels.get(creativeKey);
      const candidate: CampaignTrackingCandidate = { ...base, matchLevel: "ad", matchMethod: "creative_key" };
      if (!existing) creativeKeyLabels.set(creativeKey, candidate);
      else if (existing.campaignId !== candidate.campaignId || existing.platform !== candidate.platform || existing.brand !== candidate.brand) creativeKeyLabels.set(creativeKey, null);
    }
    try {
      const payload = JSON.parse(row.rawPayload) as { _trackingIdentifiers?: { parameter?: string; value?: string }[] };
      for (const identifier of payload._trackingIdentifiers ?? []) {
        const matchLevel = identifier.parameter === "utm_campaign" ? "campaign" : identifier.parameter === "utm_content" ? "ad_group" : "ad";
        register(exactCampaignLabels, identifier.value ?? null, { ...base, matchLevel, matchMethod: "url_utm" });
      }
    } catch {
      // Dados de mídia sem payload válido permanecem fora da conciliação por URL.
    }
  }
  type LeadEvidence = { campaign: CampaignTrackingCandidate | null; tracking: { field: string; value: string } | null; channel: string };
  const leadEvidence = new Map<string, LeadEvidence>();
  const campaignRows = new Map<string, { campaignName: string; platform: "google_ads" | "meta_ads"; matchLevel: CampaignTrackingCandidate["matchLevel"]; matchMethod: CampaignTrackingCandidate["matchMethod"]; leads: number; deals: number; won: number; lost: number; discards: number; discardReasons: Map<string, number> }>();
  const trackingRows = new Map<string, { trackingField: string; trackingValue: string; channel: string; leads: number; deals: number; won: number; lost: number; discards: number }>();
  const addCampaign = (candidate: CampaignTrackingCandidate) => {
    const key = `${candidate.platform}:${candidate.campaignId}:${candidate.matchLevel}`;
    const existing = campaignRows.get(key) ?? { campaignName: candidate.campaignName, platform: candidate.platform, matchLevel: candidate.matchLevel, matchMethod: candidate.matchMethod, leads: 0, deals: 0, won: 0, lost: 0, discards: 0, discardReasons: new Map<string, number>() };
    campaignRows.set(key, existing);
    return existing;
  };
  const addTracking = (tracking: { field: string; value: string }, channel: string) => {
    const key = `${tracking.field}:${tracking.value}`;
    const existing = trackingRows.get(key) ?? { trackingField: tracking.field, trackingValue: tracking.value, channel, leads: 0, deals: 0, won: 0, lost: 0, discards: 0 };
    trackingRows.set(key, existing);
    return existing;
  };
  let leadsWithTracking = 0;
  for (const lead of leadRows) {
    try {
      const payload = JSON.parse(lead.rawPayload) as Record<string, unknown>;
      const tracking = campaignTrackingValue(payload);
      const rawKey = tracking?.value.toLowerCase();
      const candidate = !rawKey ? null : exactCampaignLabels.has(rawKey) ? exactCampaignLabels.get(rawKey) ?? null : creativeKeyLabels.get(normalizeCreativeKey(rawKey) ?? "") ?? null;
      const channel = utmChannelLabel(payload.UTM_SOURCE);
      leadEvidence.set(String(lead.bitrixId), { campaign: candidate, tracking, channel });
      if (tracking) leadsWithTracking += 1;
      if (candidate) addCampaign(candidate).leads += 1;
      else if (tracking) addTracking(tracking, channel).leads += 1;
    } catch {
      leadEvidence.set(String(lead.bitrixId), { campaign: null, tracking: null, channel: "Não identificado" });
    }
  }
  const unassigned = { deals: 0, won: 0, lost: 0, discards: 0, discardReasons: new Map<string, number>() };
  for (const deal of dealRows) {
    try {
      const payload = JSON.parse(deal.rawPayload) as Record<string, unknown>;
      const dealBrand = bitrixDealBrand(payload);
      if (!dealBrand || (brand !== "all" && dealBrand !== brand)) continue;
      const status = dealStatusFromSemantic(payload.STAGE_SEMANTIC_ID);
      if (statusFilter !== "all" && status !== statusFilter) continue;
      const evidence = leadEvidence.get(cleanAuditString(payload.LEAD_ID) ?? "");
      const discardReason = bitrixDiscardReason(payload);
      const increment = (row: { deals: number; won: number; lost: number; discards: number }) => { row.deals += 1; if (status === "won") row.won += 1; if (status === "lost") row.lost += 1; if (discardReason) row.discards += 1; };
      if (evidence?.campaign && evidence.campaign.brand === dealBrand) {
        const row = addCampaign(evidence.campaign); increment(row);
        if (discardReason) row.discardReasons.set(discardReason, (row.discardReasons.get(discardReason) ?? 0) + 1);
      } else if (evidence?.tracking) {
        increment(addTracking(evidence.tracking, evidence.channel));
      } else {
        increment(unassigned);
        if (discardReason) unassigned.discardReasons.set(discardReason, (unassigned.discardReasons.get(discardReason) ?? 0) + 1);
      }
    } catch { unassigned.deals += 1; }
  }
  return {
    leadsWithTracking,
    exactCampaignMatches: Array.from(campaignRows.values()).reduce((sum, row) => sum + row.leads, 0),
    campaigns: Array.from(campaignRows.values()).map(row => ({ ...row, discardReasons: Array.from(row.discardReasons, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count) })).sort((a, b) => b.deals - a.deals || b.discards - a.discards),
    tracking: Array.from(trackingRows.values()).sort((a, b) => b.deals - a.deals || b.leads - a.leads),
    unassigned: { ...unassigned, discardReasons: Array.from(unassigned.discardReasons, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count) },
  };
}

function analyticsNumber(value: unknown) {
  return Number(value ?? 0) || 0;
}

export async function attributionAuditSummary(brand: AnalyticsBrand) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const brands = brand === "all" ? ["medsystems", "beautysystems"] as const : [brand] as const;
  const rows = await db.select({
    matchStatus: attributionAuditLinks.matchStatus,
    matchMethod: attributionAuditLinks.matchMethod,
    mediaPlatform: attributionAuditLinks.mediaPlatform,
    count: sql<number>`count(*)`,
    revenueValue: sql<number>`sum(${attributionAuditLinks.revenueValue})`,
  }).from(attributionAuditLinks).where(inArray(attributionAuditLinks.brand, brands)).groupBy(
    attributionAuditLinks.matchStatus,
    attributionAuditLinks.matchMethod,
    attributionAuditLinks.mediaPlatform,
  );
  return rows.map(row => ({
    matchStatus: row.matchStatus,
    matchMethod: row.matchMethod,
    mediaPlatform: row.mediaPlatform,
    count: analyticsNumber(row.count),
    revenueValue: analyticsNumber(row.revenueValue),
  }));
}

export async function refreshAttributionAuditFromBitrix(input: { brand: Exclude<AnalyticsBrand, "all">; portal: string; start: Date; end: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const rows = await db.select({ bitrixDealId: bitrix24Entities.bitrixId, rawPayload: bitrix24Entities.rawPayload })
    .from(bitrix24Entities)
    .where(and(eq(bitrix24Entities.portal, input.portal), eq(bitrix24Entities.entityType, "deal"), gte(bitrix24Entities.createdAtBitrix, input.start), lt(bitrix24Entities.createdAtBitrix, input.end)));
  const brandedRows = rows.filter(row => bitrixDealBrand(JSON.parse(row.rawPayload) as Record<string, unknown>) === input.brand);
  const [bitrixContacts, rdContacts, rdEvents, campaignRows] = await Promise.all([
    db.select({ bitrixId: bitrix24Entities.bitrixId, email: bitrix24Entities.email }).from(bitrix24Entities).where(and(eq(bitrix24Entities.portal, input.portal), eq(bitrix24Entities.entityType, "contact"))),
    db.select({ contactUuid: rdStationContacts.contactUuid, email: rdStationContacts.email }).from(rdStationContacts).where(eq(rdStationContacts.accountKey, input.brand)),
    db.select({ contactUuid: rdStationConversionEvents.contactUuid, eventUuid: rdStationConversionEvents.eventUuid, rawPayload: rdStationConversionEvents.rawPayload, eventCreatedAt: rdStationConversionEvents.eventCreatedAt }).from(rdStationConversionEvents).where(and(eq(rdStationConversionEvents.accountKey, input.brand), gte(rdStationConversionEvents.eventCreatedAt, input.start), lt(rdStationConversionEvents.eventCreatedAt, input.end))),
    db.select({ platform: mediaDailyPerformance.platform, campaignId: mediaDailyPerformance.campaignId, campaignName: mediaDailyPerformance.campaignName }).from(mediaDailyPerformance).where(and(eq(mediaDailyPerformance.recordLevel, "campaign"), eq(mediaDailyPerformance.brand, input.brand), gte(mediaDailyPerformance.reportDate, input.start), lt(mediaDailyPerformance.reportDate, input.end))),
  ]);
  const normalize = (value: string | null | undefined) => String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const bitrixEmailByContactId = new Map(bitrixContacts.filter(row => row.email).map(row => [String(row.bitrixId), normalize(row.email)]));
  const rdUuidByEmail = new Map<string, string | null>();
  for (const contact of rdContacts) {
    const email = normalize(contact.email);
    if (!email) continue;
    const existing = rdUuidByEmail.get(email);
    rdUuidByEmail.set(email, existing && existing !== contact.contactUuid ? null : contact.contactUuid);
  }
  const eventsByContact = new Map<string, { eventUuid: string; rawPayload: string; eventCreatedAt: Date }[]>();
  for (const event of rdEvents) eventsByContact.set(event.contactUuid, [...(eventsByContact.get(event.contactUuid) ?? []), event]);
  const campaigns = Array.from(new Map(campaignRows.map(row => [`${row.platform}:${row.campaignId}`, row])).values());
  const values = brandedRows.map(row => {
    const payload = JSON.parse(row.rawPayload) as Record<string, unknown>;
    const contactEmail = bitrixEmailByContactId.get(String(payload.CONTACT_ID ?? ""));
    const rdContactUuid = contactEmail ? (rdUuidByEmail.get(contactEmail) ?? null) : null;
    const bitrixUtmSource = cleanAuditString(payload.UTM_SOURCE);
    const bitrixUtmCampaign = cleanAuditString(payload.UTM_CAMPAIGN);
    const eventCandidates = (rdContactUuid ? eventsByContact.get(rdContactUuid) ?? [] : []).map(event => ({ ...event, ...rdEventAttribution(event.rawPayload) })).filter(event => event.utmSource);
    const evidence = eventCandidates.find(event => {
      const platform = utmChannelLabel(event.utmSource) === "Google Ads" ? "google_ads" : utmChannelLabel(event.utmSource) === "Meta Ads" ? "meta_ads" : null;
      return Boolean(platform && (campaigns.some(candidate => candidate.platform === platform && candidate.campaignId === event.mediaCampaignId) || (event.utmCampaign && campaigns.some(candidate => candidate.platform === platform && normalize(candidate.campaignName) === normalize(event.utmCampaign)))));
    });
    const utmSource = evidence?.utmSource ?? bitrixUtmSource;
    const utmCampaign = evidence?.utmCampaign ?? bitrixUtmCampaign;
    const channel = utmChannelLabel(utmSource);
    const mediaPlatform: "google_ads" | "meta_ads" | null = channel === "Google Ads" ? "google_ads" : channel === "Meta Ads" ? "meta_ads" : null;
    const campaignMatches = mediaPlatform ? campaigns.filter(candidate => candidate.platform === mediaPlatform && (candidate.campaignId === evidence?.mediaCampaignId || (utmCampaign && normalize(candidate.campaignName) === normalize(utmCampaign)))) : [];
    const mediaCampaignId = campaignMatches.length === 1 ? campaignMatches[0].campaignId : null;
    const rdEventUuid = mediaCampaignId && evidence ? evidence.eventUuid : null;
    const identified = Boolean(rdContactUuid && rdEventUuid && mediaCampaignId);
    return {
      brand: input.brand,
      bitrixDealId: row.bitrixDealId,
      rdContactUuid,
      rdEventUuid,
      mediaPlatform,
      mediaCampaignId,
      utmSource,
      utmCampaign,
      matchStatus: identified ? "identified" as const : mediaPlatform ? "channel_signal" as const : "not_identified" as const,
      matchMethod: identified ? "identifier" as const : mediaCampaignId ? "utm_campaign" as const : mediaPlatform ? "utm_source" as const : "none" as const,
      revenueValue: String(payload.STAGE_SEMANTIC_ID ?? "") === "S" ? Number(payload.OPPORTUNITY ?? 0) || 0 : 0,
      updatedAt: new Date(),
    };
  });
  if (!values.length) return 0;
  await db.insert(attributionAuditLinks).values(values).onDuplicateKeyUpdate({ set: {
    rdContactUuid: sql`values(rdContactUuid)`, rdEventUuid: sql`values(rdEventUuid)`, mediaPlatform: sql`values(mediaPlatform)`, mediaCampaignId: sql`values(mediaCampaignId)`, utmSource: sql`values(utmSource)`, utmCampaign: sql`values(utmCampaign)`, matchStatus: sql`values(matchStatus)`, matchMethod: sql`values(matchMethod)`, revenueValue: sql`values(revenueValue)`, updatedAt: new Date(),
  } });
  return values.length;
}

type RdUtmLeadFlow = {
  rdUtmLeads: Record<Exclude<AnalyticsBrand, "all">, number>;
  bitrixArrivals: Record<Exclude<AnalyticsBrand, "all">, number>;
};

async function rdUtmLeadFlow(brands: readonly Exclude<AnalyticsBrand, "all">[], start: Date, end: Date): Promise<RdUtmLeadFlow> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [events, rdContacts, bitrixLeads, bitrixContacts] = await Promise.all([
    db.select({ accountKey: rdStationConversionEvents.accountKey, contactUuid: rdStationConversionEvents.contactUuid, eventCreatedAt: rdStationConversionEvents.eventCreatedAt, rawPayload: rdStationConversionEvents.rawPayload })
      .from(rdStationConversionEvents)
      .where(and(inArray(rdStationConversionEvents.accountKey, brands), gte(rdStationConversionEvents.eventCreatedAt, start), lt(rdStationConversionEvents.eventCreatedAt, end))),
    db.select({ accountKey: rdStationContacts.accountKey, contactUuid: rdStationContacts.contactUuid, email: rdStationContacts.email })
      .from(rdStationContacts)
      .where(inArray(rdStationContacts.accountKey, brands)),
    db.select({ bitrixId: bitrix24Entities.bitrixId, email: bitrix24Entities.email, createdAtBitrix: bitrix24Entities.createdAtBitrix, rawPayload: bitrix24Entities.rawPayload })
      .from(bitrix24Entities)
      .where(and(eq(bitrix24Entities.portal, "medsystems.bitrix24.com.br"), eq(bitrix24Entities.entityType, "lead"))),
    db.select({ bitrixId: bitrix24Entities.bitrixId, email: bitrix24Entities.email })
      .from(bitrix24Entities)
      .where(and(eq(bitrix24Entities.portal, "medsystems.bitrix24.com.br"), eq(bitrix24Entities.entityType, "contact"))),
  ]);
  const rdEmailByContact = new Map(rdContacts.map(contact => [`${contact.accountKey}:${contact.contactUuid}`, normalizeIdentityEmail(contact.email)]));
  const firstUtmEventByContact = new Map<string, { accountKey: Exclude<AnalyticsBrand, "all">; contactUuid: string; firstEventAt: Date }>();
  for (const event of events) {
    if (!rdEventUtmValues(event.rawPayload).utmSource) continue;
    const key = `${event.accountKey}:${event.contactUuid}`;
    const current = firstUtmEventByContact.get(key);
    if (!current || event.eventCreatedAt < current.firstEventAt) {
      firstUtmEventByContact.set(key, { accountKey: event.accountKey, contactUuid: event.contactUuid, firstEventAt: event.eventCreatedAt });
    }
  }
  const candidateByBrandEmail = new Map<string, { count: number; firstEventAt: Date }>();
  for (const event of Array.from(firstUtmEventByContact.values())) {
    const email = rdEmailByContact.get(`${event.accountKey}:${event.contactUuid}`);
    if (!email) continue;
    const key = `${event.accountKey}:${email}`;
    const current = candidateByBrandEmail.get(key);
    if (current) {
      current.count += 1;
      if (event.firstEventAt < current.firstEventAt) current.firstEventAt = event.firstEventAt;
    } else candidateByBrandEmail.set(key, { count: 1, firstEventAt: event.firstEventAt });
  }
  const bitrixContactEmailById = new Map(bitrixContacts.map(contact => [String(contact.bitrixId), normalizeIdentityEmail(contact.email)]));
  const bitrixLeadByEmail = new Map<string, { count: number; firstLeadAt: Date }>();
  for (const lead of bitrixLeads) {
    try {
      const payload = JSON.parse(lead.rawPayload) as Record<string, unknown>;
      const email = normalizeIdentityEmail(lead.email) ?? bitrixContactEmailById.get(String(payload.CONTACT_ID ?? "")) ?? null;
      if (!email) continue;
      const current = bitrixLeadByEmail.get(email);
      if (current) {
        current.count += 1;
        if (lead.createdAtBitrix < current.firstLeadAt) current.firstLeadAt = lead.createdAtBitrix;
      } else bitrixLeadByEmail.set(email, { count: 1, firstLeadAt: lead.createdAtBitrix });
    } catch {
      // Sem payload utilizável, o lead não entra na atribuição auditável.
    }
  }
  const empty = () => ({ medsystems: 0, beautysystems: 0 });
  const rdUtmLeads = empty();
  const bitrixArrivals = empty();
  for (const [key, candidate] of Array.from(candidateByBrandEmail.entries())) {
    if (candidate.count !== 1) continue;
    const [accountKey, email] = key.split(":", 2) as [Exclude<AnalyticsBrand, "all">, string];
    rdUtmLeads[accountKey] += 1;
    const bitrixLead = bitrixLeadByEmail.get(email);
    if (bitrixLead?.count === 1 && bitrixLead.firstLeadAt >= candidate.firstEventAt) bitrixArrivals[accountKey] += 1;
  }
  return { rdUtmLeads, bitrixArrivals };
}

export async function rdStationOperationsDashboard(brand: AnalyticsBrand, period: AnalyticsPeriod = "2026-07") {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const range = period === "2026-08"
    ? { start: new Date("2026-08-01T00:00:00-03:00"), end: new Date("2026-08-18T00:00:00-03:00"), endLabel: "2026-08-17" }
    : { start: new Date("2026-07-01T00:00:00-03:00"), end: new Date("2026-08-01T00:00:00-03:00"), endLabel: "2026-07-31" };
  const brands = brand === "all" ? ["medsystems", "beautysystems"] as const : [brand] as const;
  const events = await db.select({ accountKey: rdStationConversionEvents.accountKey, contactUuid: rdStationConversionEvents.contactUuid, eventCreatedAt: rdStationConversionEvents.eventCreatedAt, rawPayload: rdStationConversionEvents.rawPayload })
    .from(rdStationConversionEvents)
    .where(and(inArray(rdStationConversionEvents.accountKey, brands), gte(rdStationConversionEvents.eventCreatedAt, range.start), lt(rdStationConversionEvents.eventCreatedAt, range.end)));
  const firstEventByContact = new Map<string, { accountKey: Exclude<AnalyticsBrand, "all">; contactUuid: string; eventCreatedAt: Date; rawPayload: string }>();
  const firstUtmEventByContact = new Map<string, { accountKey: Exclude<AnalyticsBrand, "all">; contactUuid: string; eventCreatedAt: Date; rawPayload: string }>();
  for (const event of events) {
    const key = `${event.accountKey}:${event.contactUuid}`;
    const first = firstEventByContact.get(key);
    if (!first || event.eventCreatedAt < first.eventCreatedAt) firstEventByContact.set(key, event as typeof first extends never ? never : NonNullable<typeof first>);
    if (!rdEventUtmValues(event.rawPayload).utmSource) continue;
    const firstUtm = firstUtmEventByContact.get(key);
    if (!firstUtm || event.eventCreatedAt < firstUtm.eventCreatedAt) firstUtmEventByContact.set(key, event as typeof firstUtm extends never ? never : NonNullable<typeof firstUtm>);
  }
  const byDay = new Map<string, number>();
  const byBrand = { medsystems: { convertedContacts: 0, utmLeads: 0 }, beautysystems: { convertedContacts: 0, utmLeads: 0 } };
  const sources = new Map<string, number>();
  const mediums = new Map<string, number>();
  const campaigns = new Map<string, { count: number; channel: string }>();
  const campaignConflicts = new Map<string, { count: number; expectedBrand: Exclude<AnalyticsBrand, "all">; channel: string }>();
  const eventTypes = new Map<string, number>();
  const eventConflicts = new Map<string, { count: number; expectedBrand: Exclude<AnalyticsBrand, "all"> }>();
  const coverage = { withSource: 0, withMedium: 0, withCampaign: 0, withContent: 0, withTerm: 0 };
  for (const event of Array.from(firstEventByContact.values())) byBrand[event.accountKey].convertedContacts += 1;
  for (const event of Array.from(firstUtmEventByContact.values())) {
    byBrand[event.accountKey].utmLeads += 1;
    const details = rdEventUtmValues(event.rawPayload);
    const payload = (() => { try { return (JSON.parse(event.rawPayload) as { payload?: Record<string, unknown> }).payload ?? {}; } catch { return {}; } })();
    const day = event.eventCreatedAt.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
    const dailyKey = `${day}:${event.accountKey}`;
    byDay.set(dailyKey, (byDay.get(dailyKey) ?? 0) + 1);
    const source = details.utmSource ?? "Não identificado";
    sources.set(source, (sources.get(source) ?? 0) + 1);
    const medium = details.utmMedium ?? "Não identificado";
    mediums.set(medium, (mediums.get(medium) ?? 0) + 1);
    const campaign = details.utmCampaign ?? "Não identificado";
    const campaignBrand = rdCampaignBrandHint(campaign);
    if (campaignBrand && campaignBrand !== event.accountKey) {
      const conflict = campaignConflicts.get(campaign) ?? { count: 0, expectedBrand: campaignBrand, channel: utmChannelLabel(details.utmSource) };
      conflict.count += 1;
      campaignConflicts.set(campaign, conflict);
    } else {
      const campaignRow = campaigns.get(campaign) ?? { count: 0, channel: utmChannelLabel(details.utmSource) };
      campaignRow.count += 1;
      campaigns.set(campaign, campaignRow);
    }
    const eventType = cleanAuditString(payload.conversion_event ?? payload.conversion_identifier ?? payload.event_identifier ?? payload.event_type ?? payload.cf_conversion_event) ?? "Evento RD com UTM";
    const eventBrand = rdCampaignBrandHint(eventType);
    if (eventBrand && eventBrand !== event.accountKey) {
      const conflict = eventConflicts.get(eventType) ?? { count: 0, expectedBrand: eventBrand };
      conflict.count += 1;
      eventConflicts.set(eventType, conflict);
    } else {
      eventTypes.set(eventType, (eventTypes.get(eventType) ?? 0) + 1);
    }
    if (details.utmSource) coverage.withSource += 1;
    if (details.utmMedium) coverage.withMedium += 1;
    if (details.utmCampaign) coverage.withCampaign += 1;
    if (details.utmContent) coverage.withContent += 1;
    if (details.utmTerm) coverage.withTerm += 1;
  }
  const breakdown = (rows: Map<string, number>) => Array.from(rows, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  const totals = brands.reduce((acc, current) => ({ convertedContacts: acc.convertedContacts + byBrand[current].convertedContacts, utmLeads: acc.utmLeads + byBrand[current].utmLeads }), { convertedContacts: 0, utmLeads: 0 });
  return {
    period: { key: period, start: period === "2026-08" ? "2026-08-01" : "2026-07-01", end: range.endLabel },
    totals,
    byBrand,
    coverage,
    byDay: Array.from(byDay, ([key, count]) => { const [date, accountKey] = key.split(":", 2); return { date, brand: accountKey as Exclude<AnalyticsBrand, "all">, count }; }).sort((a, b) => a.date.localeCompare(b.date) || a.brand.localeCompare(b.brand)),
    sources: breakdown(sources),
    mediums: breakdown(mediums),
    campaigns: Array.from(campaigns, ([campaign, data]) => ({ campaign, ...data })).sort((a, b) => b.count - a.count),
    campaignConflicts: Array.from(campaignConflicts, ([campaign, data]) => ({ campaign, ...data })).sort((a, b) => b.count - a.count),
    conversionEvents: breakdown(eventTypes),
    eventConflicts: Array.from(eventConflicts, ([label, data]) => ({ label, ...data })).sort((a, b) => b.count - a.count),
  };
}

export async function mediaDashboardAnalytics(brand: AnalyticsBrand, period: AnalyticsPeriod = "2026-07") {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const periodRange = {
    "2026-07": { start: new Date("2026-07-01T00:00:00-03:00"), end: new Date("2026-08-01T00:00:00-03:00"), endLabel: "2026-07-31", rdLeadsAvailable: true },
    "2026-08": { start: new Date("2026-08-01T00:00:00-03:00"), end: new Date("2026-08-20T00:00:00-03:00"), endLabel: "2026-08-19", rdEnd: new Date("2026-08-18T00:00:00-03:00"), rdEndLabel: "2026-08-17", rdLeadsAvailable: true },
  }[period];
  const { start, end } = periodRange;
  const rdEnd = (period === "2026-08" ? periodRange.rdEnd : end) ?? end;
  const brands = brand === "all" ? ["medsystems", "beautysystems"] as const : [brand] as const;
  const mediaWhere = and(eq(mediaDailyPerformance.recordLevel, "campaign"), inArray(mediaDailyPerformance.brand, brands), gte(mediaDailyPerformance.reportDate, start), lt(mediaDailyPerformance.reportDate, end));
  const adWhere = and(eq(mediaDailyPerformance.recordLevel, "ad"), inArray(mediaDailyPerformance.brand, brands), gte(mediaDailyPerformance.reportDate, start), lt(mediaDailyPerformance.reportDate, end));

  const [mediaTotal] = await db.select({
    spend: sql<number>`sum(${mediaDailyPerformance.spend})`,
    impressions: sql<number>`sum(${mediaDailyPerformance.impressions})`,
    reach: sql<number>`sum(${mediaDailyPerformance.reach})`,
    clicks: sql<number>`sum(${mediaDailyPerformance.clicks})`,
    platformLeads: sql<number>`sum(${mediaDailyPerformance.platformLeads})`,
  }).from(mediaDailyPerformance).where(mediaWhere);

  const platforms = await db.select({
    platform: mediaDailyPerformance.platform,
    spend: sql<number>`sum(${mediaDailyPerformance.spend})`,
    impressions: sql<number>`sum(${mediaDailyPerformance.impressions})`,
    clicks: sql<number>`sum(${mediaDailyPerformance.clicks})`,
    leads: sql<number>`sum(${mediaDailyPerformance.platformLeads})`,
  }).from(mediaDailyPerformance).where(mediaWhere).groupBy(mediaDailyPerformance.platform);

  const brandPlatforms = await db.select({
    brand: mediaDailyPerformance.brand,
    platform: mediaDailyPerformance.platform,
    spend: sql<number>`sum(${mediaDailyPerformance.spend})`,
    impressions: sql<number>`sum(${mediaDailyPerformance.impressions})`,
    clicks: sql<number>`sum(${mediaDailyPerformance.clicks})`,
    leads: sql<number>`sum(${mediaDailyPerformance.platformLeads})`,
  }).from(mediaDailyPerformance).where(mediaWhere).groupBy(mediaDailyPerformance.brand, mediaDailyPerformance.platform);

  const campaigns = await db.select({
    platform: mediaDailyPerformance.platform,
    brand: mediaDailyPerformance.brand,
    campaignId: mediaDailyPerformance.campaignId,
    campaignName: mediaDailyPerformance.campaignName,
    spend: sql<number>`sum(${mediaDailyPerformance.spend})`,
    impressions: sql<number>`sum(${mediaDailyPerformance.impressions})`,
    clicks: sql<number>`sum(${mediaDailyPerformance.clicks})`,
    leads: sql<number>`sum(${mediaDailyPerformance.platformLeads})`,
  }).from(mediaDailyPerformance).where(mediaWhere).groupBy(
    mediaDailyPerformance.platform,
    mediaDailyPerformance.brand,
    mediaDailyPerformance.campaignId,
    mediaDailyPerformance.campaignName,
  ).orderBy(desc(sql`sum(${mediaDailyPerformance.spend})`)).limit(20);

  const ads = await db.select({
    platform: mediaDailyPerformance.platform,
    brand: mediaDailyPerformance.brand,
    campaignId: mediaDailyPerformance.campaignId,
    campaignName: mediaDailyPerformance.campaignName,
    adGroupId: mediaDailyPerformance.adGroupId,
    adGroupName: mediaDailyPerformance.adGroupName,
    adId: mediaDailyPerformance.adId,
    adName: mediaDailyPerformance.adName,
    spend: sql<number>`sum(${mediaDailyPerformance.spend})`,
    impressions: sql<number>`sum(${mediaDailyPerformance.impressions})`,
    clicks: sql<number>`sum(${mediaDailyPerformance.clicks})`,
    leads: sql<number>`sum(${mediaDailyPerformance.platformLeads})`,
  }).from(mediaDailyPerformance).where(adWhere).groupBy(
    mediaDailyPerformance.platform,
    mediaDailyPerformance.brand,
    mediaDailyPerformance.campaignId,
    mediaDailyPerformance.campaignName,
    mediaDailyPerformance.adGroupId,
    mediaDailyPerformance.adGroupName,
    mediaDailyPerformance.adId,
    mediaDailyPerformance.adName,
  ).orderBy(desc(sql`sum(${mediaDailyPerformance.spend})`)).limit(80);

  const methodologyRows = await db.select({
    brand: mediaDailyPerformance.brand,
    platform: mediaDailyPerformance.platform,
    rawPayload: mediaDailyPerformance.rawPayload,
  }).from(mediaDailyPerformance).where(mediaWhere);

  const rdQualified = period === "2026-07"
    ? await db.select({ accountKey: rdStationJulyLeadViews.accountKey, count: sql<number>`count(*)` })
      .from(rdStationJulyLeadViews)
      .where(and(inArray(rdStationJulyLeadViews.accountKey, brands), eq(rdStationJulyLeadViews.viewType, "primeira"), eq(rdStationJulyLeadViews.status, "qualificado")))
      .groupBy(rdStationJulyLeadViews.accountKey)
    : await db.select({ accountKey: rdStationConversionEvents.accountKey, count: sql<number>`count(distinct ${rdStationConversionEvents.contactUuid})` })
      .from(rdStationConversionEvents)
      .where(and(inArray(rdStationConversionEvents.accountKey, brands), gte(rdStationConversionEvents.eventCreatedAt, start), lt(rdStationConversionEvents.eventCreatedAt, rdEnd)))
      .groupBy(rdStationConversionEvents.accountKey);
  const rdUtmFlow = await rdUtmLeadFlow(brands, start, rdEnd);
  const paidMediaLeadComponents = summarizePaidMediaLeadComponents(methodologyRows);
  const attribution = period === "2026-07" ? await attributionAuditSummary(brand) : [];

  return {
    period: { key: period, start: period === "2026-07" ? "2026-07-01" : "2026-08-01", end: periodRange.endLabel, rdEnd: "rdEndLabel" in periodRange ? periodRange.rdEndLabel : periodRange.endLabel },
    media: {
      spend: analyticsNumber(mediaTotal?.spend),
      impressions: analyticsNumber(mediaTotal?.impressions),
      reach: analyticsNumber(mediaTotal?.reach),
      clicks: analyticsNumber(mediaTotal?.clicks),
      platformLeads: analyticsNumber(mediaTotal?.platformLeads),
    },
    platforms: platforms.map(row => ({ platform: row.platform, spend: analyticsNumber(row.spend), impressions: analyticsNumber(row.impressions), clicks: analyticsNumber(row.clicks), leads: analyticsNumber(row.leads) })),
    brandPlatforms: brandPlatforms.map(row => ({ brand: row.brand, platform: row.platform, spend: analyticsNumber(row.spend), impressions: analyticsNumber(row.impressions), clicks: analyticsNumber(row.clicks), leads: analyticsNumber(row.leads) })),
    campaigns: campaigns.map(row => ({ platform: row.platform, brand: row.brand, campaignId: row.campaignId, campaignName: row.campaignName ?? "Sem nome", spend: analyticsNumber(row.spend), impressions: analyticsNumber(row.impressions), clicks: analyticsNumber(row.clicks), leads: analyticsNumber(row.leads) })),
    ads: ads.map(row => ({ platform: row.platform, brand: row.brand, campaignId: row.campaignId, campaignName: row.campaignName ?? "Sem nome", adGroupId: row.adGroupId ?? "", adGroupName: row.adGroupName ?? "Sem grupo", adId: row.adId ?? "", adName: row.adName ?? "Sem nome", spend: analyticsNumber(row.spend), impressions: analyticsNumber(row.impressions), clicks: analyticsNumber(row.clicks), leads: analyticsNumber(row.leads) })),
    rdLeads: Object.fromEntries(rdQualified.map(row => [row.accountKey, analyticsNumber(row.count)])),
    rdUtmLeads: rdUtmFlow.rdUtmLeads,
    bitrixArrivals: rdUtmFlow.bitrixArrivals,
    paidMediaLeadComponents,
    sourceAvailability: { rdLeads: rdQualified.length > 0, rdUtmLeads: true, attribution: period === "2026-07" },
    attribution,
  };
}

type PaidMediaMethodologyRow = { brand: string; platform: string; rawPayload: string | null };
type PaidMediaLeadComponents = { instantForms: number; messagingConversations: number; messagingFirstReplies: number; messagingConnections: number };

const emptyPaidMediaLeadComponents = (): PaidMediaLeadComponents => ({ instantForms: 0, messagingConversations: 0, messagingFirstReplies: 0, messagingConnections: 0 });

export function summarizePaidMediaLeadComponents(rows: PaidMediaMethodologyRow[]) {
  const result: Record<string, PaidMediaLeadComponents> = {
    medsystems: emptyPaidMediaLeadComponents(),
    beautysystems: emptyPaidMediaLeadComponents(),
  };
  for (const row of rows) {
    if (row.platform !== "meta_ads" || !(row.brand in result)) continue;
    try {
      const payload = JSON.parse(row.rawPayload ?? "{}") as Record<string, unknown>;
      const toNumber = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
      const bucket = result[row.brand];
      bucket.instantForms += toNumber(payload.actions_leadgen_grouped);
      bucket.messagingConversations += toNumber(payload.actions_onsite_conversion_messaging_conversation_started_7d);
      bucket.messagingFirstReplies += toNumber(payload.actions_onsite_conversion_messaging_first_reply);
      bucket.messagingConnections += toNumber(payload.actions_onsite_conversion_total_messaging_connection);
    } catch {
      // Registros sem payload JSON não contribuem para componentes Meta.
    }
  }
  return result;
}

export async function getPendingJulyViewCandidates(accountKey: RdAccountKey, viewType: JulyViewType, limit: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const dateColumn = viewType === "primeira" ? rdStationContacts.createdAtRd : rdStationContacts.lastConversionAt;
  const candidates = await db.select({
    contactUuid: rdStationContacts.contactUuid,
    contactDate: dateColumn,
  }).from(rdStationContacts).where(and(
    eq(rdStationContacts.accountKey, accountKey),
    gte(dateColumn, JULY_2026.start),
    lt(dateColumn, JULY_2026.end),
  )).orderBy(asc(rdStationContacts.id));
  const processed = await db.select({ contactUuid: rdStationJulyLeadViews.contactUuid }).from(rdStationJulyLeadViews)
    .where(and(eq(rdStationJulyLeadViews.accountKey, accountKey), eq(rdStationJulyLeadViews.viewType, viewType)));
  const processedIds = new Set(processed.map(row => row.contactUuid));
  return candidates.filter(candidate => !processedIds.has(candidate.contactUuid)).slice(0, limit);
}

export async function upsertJulyViewResult(input: {
  accountKey: RdAccountKey;
  contactUuid: string;
  viewType: JulyViewType;
  contactDate: Date;
  eventTimestamp: Date | null;
  sourceBucket: string | null;
  eventIdentifier: string | null;
  eventFamily: string | null;
  status: "qualificado" | "rejeitado";
  rejectionReason: string | null;
  rawEventPayload: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  await db.insert(rdStationJulyLeadViews).values({
    ...input,
    processedAt: new Date(),
  }).onDuplicateKeyUpdate({ set: {
    eventTimestamp: input.eventTimestamp,
    sourceBucket: input.sourceBucket,
    eventIdentifier: input.eventIdentifier,
    eventFamily: input.eventFamily,
    status: input.status,
    rejectionReason: input.rejectionReason,
    rawEventPayload: input.rawEventPayload,
    processedAt: new Date(),
  } });
}
