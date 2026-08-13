import { and, asc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
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
