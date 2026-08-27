import { randomUUID } from "node:crypto";
import {
  createSyncRun,
  getAccountByKey,
  getContactsForEventWindow,
  getContactsPendingEventSync,
  getRdUtmContactUuids,
  getPendingJulyViewCandidates,
  listIntegrationAccounts,
  markContactsEventsSynced,
  saveOAuthState,
  saveTokensForAccount,
  setAccountSegmentation,
  setAccountSyncStatus,
  updateContactSyncProgress,
  upsertContacts,
  upsertConversionEvents,
  upsertJulyViewResult,
  validateAndConsumeOAuthState,
} from "../db";
import { decryptSecret, encryptSecret, sha256 } from "./crypto";
import { qualifiesDirectApiEvent } from "./filtering";
import { buildOAuthState, tokenExpiryFromSeconds } from "./oauth";
import { isInJuly2026, RD_ACCOUNT_META, type RdAccountKey } from "./types";

const RD_API_BASE = "https://api.rd.services";
const PAGE_SIZE = 125;
const EVENT_BATCH_SIZE = 8;
const AUGUST_2026_START = new Date("2026-08-01T03:00:00.000Z");
const todayBrt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const currentDayStartBrt = new Date(`${todayBrt}T00:00:00-03:00`);
const augustMonthEnd = new Date("2026-09-01T03:00:00.000Z");
const AUGUST_2026_END = currentDayStartBrt < augustMonthEnd ? currentDayStartBrt : augustMonthEnd;

export function isInAugustThroughD1(value: string) {
  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && date >= AUGUST_2026_START && date < AUGUST_2026_END;
}

type TokenPayload = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

function credentialsFor(accountKey: RdAccountKey) {
  const prefix = `RDSTATION_${accountKey.toUpperCase()}`;
  const clientId = process.env[`${prefix}_CLIENT_ID`];
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
  if (!clientId || !clientSecret) {
    throw new Error(`As credenciais OAuth da conta ${RD_ACCOUNT_META[accountKey].label} ainda não foram configuradas.`);
  }
  return { clientId, clientSecret };
}

async function rdTokenRequest(path: string, body: Record<string, string>) {
  const response = await fetch(`${RD_API_BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || "O RD Station recusou a operação de autenticação.");
  }
  if (!payload.access_token || !payload.refresh_token || !payload.expires_in) {
    throw new Error("A resposta de tokens do RD Station está incompleta.");
  }
  return payload as TokenPayload;
}

async function persistTokens(accountKey: RdAccountKey, payload: TokenPayload) {
  const expiresAt = tokenExpiryFromSeconds(payload.expires_in);
  await saveTokensForAccount({
    accountKey,
    accessTokenCiphertext: encryptSecret(payload.access_token),
    refreshTokenCiphertext: encryptSecret(payload.refresh_token),
    tokenExpiresAt: expiresAt,
  });
}

export function callbackUrl(origin: string) {
  const configuredOrigin = process.env.RDSTATION_CALLBACK_BASE_URL?.trim();
  const baseUrl = configuredOrigin && /^https:\/\//.test(configuredOrigin) ? configuredOrigin : origin;
  return `${baseUrl.replace(/\/$/, "")}/api/rdstation/callback`;
}

export async function createAuthorizationUrl(accountKey: RdAccountKey, origin: string) {
  const { clientId } = credentialsFor(accountKey);
  const nonce = randomUUID().replaceAll("-", "");
  const state = buildOAuthState(accountKey, nonce);
  await saveOAuthState(accountKey, state);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl(origin),
    state,
  });
  return { authorizationUrl: `${RD_API_BASE}/auth/dialog?${params.toString()}`, callbackUrl: callbackUrl(origin) };
}

export async function exchangeAuthorizationCode(accountKey: RdAccountKey, state: string, code: string) {
  const valid = await validateAndConsumeOAuthState(accountKey, state);
  if (!valid) throw new Error("A autorização expirou, já foi utilizada ou não pertence a esta conta.");
  const { clientId, clientSecret } = credentialsFor(accountKey);
  const tokens = await rdTokenRequest("/auth/token?token_by=code", {
    client_id: clientId,
    client_secret: clientSecret,
    code,
  });
  await persistTokens(accountKey, tokens);
}

async function refreshAccessToken(accountKey: RdAccountKey) {
  const account = await getAccountByKey(accountKey);
  if (!account?.refreshTokenCiphertext) throw new Error(`A conta ${RD_ACCOUNT_META[accountKey].label} ainda não foi autorizada.`);
  const { clientId, clientSecret } = credentialsFor(accountKey);
  const tokens = await rdTokenRequest("/auth/token", {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: decryptSecret(account.refreshTokenCiphertext),
  });
  await persistTokens(accountKey, tokens);
  return tokens.access_token;
}

async function validAccessToken(accountKey: RdAccountKey, forceRefresh = false) {
  const account = await getAccountByKey(accountKey);
  if (!account?.accessTokenCiphertext || !account.tokenExpiresAt) {
    throw new Error(`A conta ${RD_ACCOUNT_META[accountKey].label} ainda não foi autorizada.`);
  }
  if (!forceRefresh && account.tokenExpiresAt.getTime() > Date.now() + 90_000) {
    return decryptSecret(account.accessTokenCiphertext);
  }
  return refreshAccessToken(accountKey);
}

async function rdGet(accountKey: RdAccountKey, path: string, retried = false) {
  const accessToken = await validAccessToken(accountKey, retried);
  let response: Response;
  try {
    response = await fetch(`${RD_API_BASE}${path}`, {
      headers: { accept: "application/json", authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("A API do RD Station excedeu 30 segundos para responder. A coleta pode ser retomada sem duplicar contatos.");
    }
    throw error;
  }
  if (response.status === 401 && !retried) return rdGet(accountKey, path, true);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `A API do RD Station retornou ${response.status}.`);
  }
  return { payload, headers: response.headers };
}

export function rdPhoneFromContactDetail(contact: Record<string, unknown>) {
  const phones = Array.isArray(contact.phones) ? contact.phones : [];
  const candidates: unknown[] = [contact.phone, contact.mobile_phone, contact.personal_phone, contact.phone_number, ...phones];
  for (const candidate of candidates) {
    const value = typeof candidate === "string"
      ? candidate
      : candidate && typeof candidate === "object"
        ? String((candidate as Record<string, unknown>).phone ?? (candidate as Record<string, unknown>).value ?? (candidate as Record<string, unknown>).number ?? "")
        : "";
    if (value.trim()) return value.trim();
  }
  return null;
}

export async function hydrateUtmContactPhones(accountKey: RdAccountKey, start: Date, end: Date, maxContacts = Number.MAX_SAFE_INTEGER) {
  const contactUuids = (await getRdUtmContactUuids(accountKey, start, end)).slice(0, Math.max(0, maxContacts));
  const contacts: Record<string, unknown>[] = [];
  let errors = 0;
  const concurrency = 6;
  for (let index = 0; index < contactUuids.length; index += concurrency) {
    const batch = contactUuids.slice(index, index + concurrency);
    const outcomes = await Promise.allSettled(batch.map(async contactUuid => {
      const { payload } = await rdGet(accountKey, `/platform/contacts/${encodeURIComponent(contactUuid)}`);
      const detail = payload && typeof payload === "object" && "contact" in payload && typeof payload.contact === "object"
        ? payload.contact as Record<string, unknown>
        : payload as Record<string, unknown>;
      const phone = rdPhoneFromContactDetail(detail);
      return { ...detail, uuid: String(detail.uuid ?? contactUuid), phone };
    }));
    for (const outcome of outcomes) {
      if (outcome.status === "fulfilled") contacts.push(outcome.value);
      else errors += 1;
    }
    if ((index + batch.length) % 30 === 0 || index + batch.length === contactUuids.length) {
      console.log(`[RD phone] ${accountKey}: ${index + batch.length}/${contactUuids.length} detalhes consultados`);
    }
  }
  await upsertContacts(accountKey, contacts);
  return { selected: contactUuids.length, detailsFetched: contacts.length, phonesFound: contacts.filter(contact => Boolean(contact.phone)).length, errors };
}

export async function updateSegmentation(accountKey: RdAccountKey, segmentationId: string) {
  await setAccountSegmentation(accountKey, segmentationId.trim());
}

export async function fetchSegmentations(accountKey: RdAccountKey) {
  const items: { id: string; name: string }[] = [];
  for (let page = 1; ; page += 1) {
    const { payload, headers } = await rdGet(accountKey, `/platform/segmentations?page=${page}&page_size=${PAGE_SIZE}`);
    const rows = payload.segmentations ?? payload.data ?? [];
    if (!Array.isArray(rows) || !rows.length) break;
    items.push(...rows.map((item: Record<string, unknown>) => ({
      id: String(item.id ?? item.uuid ?? ""),
      name: String(item.name ?? item.label ?? "Sem nome"),
    })).filter((item: { id: string }) => Boolean(item.id)));
    const totalRows = Number(headers.get("pagination-total-rows") ?? 0);
    if (rows.length < PAGE_SIZE || (totalRows > 0 && page * PAGE_SIZE >= totalRows)) break;
  }
  return items;
}

export async function inspectDirectContactsPage(accountKey: RdAccountKey, pageSize = PAGE_SIZE) {
  const safePageSize = Math.max(1, Math.min(PAGE_SIZE, pageSize));
  const { payload, headers } = await rdGet(accountKey, `/platform/contacts?page=1&page_size=${safePageSize}`);
  const contacts = Array.isArray(payload.contacts) ? payload.contacts : (Array.isArray(payload) ? payload : []);
  const sample = contacts[0] as Record<string, unknown> | undefined;
  return {
    count: contacts.length,
    total: Number(headers.get("pagination-total-rows") ?? 0),
    fields: sample ? Object.keys(sample).sort() : [],
  };
}

export async function syncNextContactPage(accountKey: RdAccountKey) {
  const account = await getAccountByKey(accountKey);
  if (!account?.segmentationId) throw new Error("Informe o identificador da segmentação de julho de 2026 antes de sincronizar.");
  await setAccountSyncStatus(accountKey, "sincronizando", null);
  const run = await createSyncRun(accountKey, "contatos");
  const page = account.contactSyncPage || 1;
  try {
    const { payload, headers } = await rdGet(
      accountKey,
      `/platform/segmentations/${encodeURIComponent(account.segmentationId)}/contacts?page=${page}&page_size=${PAGE_SIZE}`,
    );
    const contacts = Array.isArray(payload.contacts) ? payload.contacts : [];
    await upsertContacts(accountKey, contacts);
    const total = Number(headers.get("pagination-total-rows") ?? account.contactSyncTotal ?? 0);
    const complete = contacts.length < PAGE_SIZE || (total > 0 && page * PAGE_SIZE >= total);
    await updateContactSyncProgress({
      accountKey,
      nextPage: complete ? page : page + 1,
      total,
      completedAt: complete ? new Date() : null,
    });
    await setAccountSyncStatus(accountKey, "pronta", null, new Date());
    return { runId: run.id, imported: contacts.length, page, total, complete };
  } catch (error) {
    await setAccountSyncStatus(accountKey, "erro", error instanceof Error ? error.message : "Erro desconhecido");
    throw error;
  }
}

export async function syncNextJulyConversionBatch(accountKey: RdAccountKey) {
  await setAccountSyncStatus(accountKey, "sincronizando", null);
  const run = await createSyncRun(accountKey, "conversoes");
  const contacts = await getContactsPendingEventSync(accountKey, EVENT_BATCH_SIZE);
  let eventsStored = 0;
  try {
    for (const contact of contacts) {
      const selectedEvents: Record<string, unknown>[] = [];
      for (let page = 1; ; page += 1) {
        const { payload } = await rdGet(
          accountKey,
          `/platform/contacts/${encodeURIComponent(contact.contactUuid)}/events?event_type=CONVERSION&order=created_at:asc&page=${page}`,
        );
        const events = Array.isArray(payload) ? payload : (Array.isArray(payload.events) ? payload.events : []);
        selectedEvents.push(...events.filter((event: Record<string, unknown>) => isInJuly2026(String(event.event_timestamp ?? event.created_at ?? ""))));
        if (events.length < 10) break;
      }
      await upsertConversionEvents(accountKey, contact.contactUuid, selectedEvents);
      await markContactsEventsSynced([contact.id]);
      eventsStored += selectedEvents.length;
    }
    await setAccountSyncStatus(accountKey, "pronta", null, new Date());
    return { runId: run.id, contactsProcessed: contacts.length, eventsStored, complete: contacts.length < EVENT_BATCH_SIZE };
  } catch (error) {
    await setAccountSyncStatus(accountKey, "erro", error instanceof Error ? error.message : "Erro desconhecido");
    throw error;
  }
}

export async function syncAugustConversionBatch(accountKey: RdAccountKey, afterId = 0, limit = EVENT_BATCH_SIZE) {
  await setAccountSyncStatus(accountKey, "sincronizando", null);
  const run = await createSyncRun(accountKey, "conversoes");
  const contacts = await getContactsForEventWindow(accountKey, AUGUST_2026_START, AUGUST_2026_END, afterId, limit);
  let eventsStored = 0;
  try {
    const syncContact = async (contact: (typeof contacts)[number]) => {
      const selectedEvents: Record<string, unknown>[] = [];
      for (let page = 1; ; page += 1) {
        const { payload } = await rdGet(
          accountKey,
          `/platform/contacts/${encodeURIComponent(contact.contactUuid)}/events?event_type=CONVERSION&order=created_at:asc&page=${page}`,
        );
        const events = Array.isArray(payload) ? payload : (Array.isArray(payload.events) ? payload.events : []);
        selectedEvents.push(...events.filter((event: Record<string, unknown>) => isInAugustThroughD1(String(event.event_timestamp ?? event.created_at ?? ""))));
        if (events.length < 10) break;
      }
      await upsertConversionEvents(accountKey, contact.contactUuid, selectedEvents);
      await markContactsEventsSynced([contact.id]);
      return selectedEvents.length;
    };
    const concurrency = 3;
    for (let index = 0; index < contacts.length; index += concurrency) {
      const outcomes = await Promise.all(contacts.slice(index, index + concurrency).map(syncContact));
      eventsStored += outcomes.reduce((total, count) => total + count, 0);
    }
    await setAccountSyncStatus(accountKey, "pronta", null, new Date());
    const nextCursor = contacts.length ? contacts[contacts.length - 1].id : afterId;
    return { runId: run.id, contactsProcessed: contacts.length, eventsStored, nextCursor, complete: contacts.length < limit };
  } catch (error) {
    await setAccountSyncStatus(accountKey, "erro", error instanceof Error ? error.message : "Erro desconhecido");
    throw error;
  }
}

export async function syncDirectJulyViewBatch(accountKey: RdAccountKey, viewType: "primeira" | "ultima", limit = 20) {
  await setAccountSyncStatus(accountKey, "sincronizando", null);
  const run = await createSyncRun(accountKey, "conversoes");
  const candidates = await getPendingJulyViewCandidates(accountKey, viewType, limit);
  const direction = viewType === "primeira" ? "asc" : "desc";
  try {
    const processCandidate = async (candidate: (typeof candidates)[number]) => {
      const { payload } = await rdGet(
        accountKey,
        `/platform/contacts/${encodeURIComponent(candidate.contactUuid)}/events?event_type=CONVERSION&order=created_at&direction=${direction}&page=1`,
      );
      const events = Array.isArray(payload) ? payload : (Array.isArray(payload.events) ? payload.events : []);
      const event = events[0] as Record<string, unknown> | undefined;
      if (!event) {
        await upsertJulyViewResult({
          accountKey, contactUuid: candidate.contactUuid, viewType, contactDate: candidate.contactDate!,
          eventTimestamp: null, sourceBucket: null, eventIdentifier: null, eventFamily: null,
          status: "rejeitado", rejectionReason: "sem_evento_de_conversao", rawEventPayload: null,
        });
        return "rejeitado" as const;
      }
      const eventTimestamp = new Date(String(event.event_timestamp ?? ""));
      const eventInJuly = !Number.isNaN(eventTimestamp.valueOf()) && isInJuly2026(eventTimestamp);
      const verdict = qualifiesDirectApiEvent(event);
      const status = eventInJuly && verdict.qualifies ? "qualificado" : "rejeitado";
      const rejectionReason = !eventInJuly ? "evento_fora_de_julho" : verdict.isImportation ? "importacao" : verdict.sourceBucket === "nao_permitida" ? "origem_nao_permitida" : null;
      await upsertConversionEvents(accountKey, candidate.contactUuid, [event]);
      await upsertJulyViewResult({
        accountKey,
        contactUuid: candidate.contactUuid,
        viewType,
        contactDate: candidate.contactDate!,
        eventTimestamp: Number.isNaN(eventTimestamp.valueOf()) ? null : eventTimestamp,
        sourceBucket: verdict.sourceBucket,
        eventIdentifier: event.event_identifier ? String(event.event_identifier) : null,
        eventFamily: event.event_family ? String(event.event_family) : null,
        status,
        rejectionReason,
        rawEventPayload: JSON.stringify(event),
      });
      return status;
    };
    const results: Array<"qualificado" | "rejeitado"> = [];
    const concurrency = 2;
    for (let index = 0; index < candidates.length; index += concurrency) {
      const outcomes = await Promise.all(candidates.slice(index, index + concurrency).map(processCandidate));
      results.push(...outcomes);
    }
    const qualified = results.filter(result => result === "qualificado").length;
    const rejected = results.length - qualified;
    await setAccountSyncStatus(accountKey, "pronta", null, new Date());
    return { runId: run.id, viewType, processed: candidates.length, qualified, rejected, complete: candidates.length < limit };
  } catch (error) {
    await setAccountSyncStatus(accountKey, "erro", error instanceof Error ? error.message : "Erro desconhecido");
    throw error;
  }
}

export async function integrationStatus() {
  return listIntegrationAccounts();
}
