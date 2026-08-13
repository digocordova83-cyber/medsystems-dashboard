import { and, asc, desc, eq, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
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
  const source = String(value ?? "").trim().toLowerCase();
  if (source === "google" || source.includes("google")) return "Google Ads";
  if (source === "facebook" || source === "fb" || source === "meta" || source.includes("facebook") || source.includes("meta")) return "Meta Ads";
  return "Não identificado";
}

export function dealStatusFromSemantic(value: unknown): Exclude<DealStatusFilter, "all"> {
  const semantic = String(value ?? "");
  return semantic === "S" ? "won" : semantic === "F" ? "lost" : "open";
}

export async function bitrixDealJulyAnalytics(portal: string, start: Date, end: Date, statusFilter: DealStatusFilter = "all") {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const rows = await db.select({ stageOrStatus: bitrix24Entities.stageOrStatus, rawPayload: bitrix24Entities.rawPayload })
    .from(bitrix24Entities)
    .where(and(eq(bitrix24Entities.portal, portal), eq(bitrix24Entities.entityType, "deal"), gte(bitrix24Entities.createdAtBitrix, start), lt(bitrix24Entities.createdAtBitrix, end)));
  const sources = new Map<string, { count: number; value: number }>();
  const losses = new Map<string, { count: number; value: number; withObservation: number }>();
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
    const semantic = String(payload.STAGE_SEMANTIC_ID ?? "");
    const dealStatus = dealStatusFromSemantic(semantic);
    if (statusFilter !== "all" && dealStatus !== statusFilter) continue;
    total += 1;
    const sourceId = String(payload.SOURCE_ID ?? "");
    const value = Number(payload.OPPORTUNITY ?? 0) || 0;
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
  };
}

function analyticsNumber(value: unknown) {
  return Number(value ?? 0) || 0;
}

export async function mediaDashboardAnalytics(brand: AnalyticsBrand) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const start = new Date("2026-07-01T00:00:00-03:00");
  const end = new Date("2026-08-01T00:00:00-03:00");
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

  const rdQualified = await db.select({ accountKey: rdStationJulyLeadViews.accountKey, count: sql<number>`count(*)` })
    .from(rdStationJulyLeadViews)
    .where(and(inArray(rdStationJulyLeadViews.accountKey, brands), eq(rdStationJulyLeadViews.viewType, "primeira"), eq(rdStationJulyLeadViews.status, "qualificado")))
    .groupBy(rdStationJulyLeadViews.accountKey);

  return {
    period: { start: "2026-07-01", end: "2026-07-31" },
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
  };
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
