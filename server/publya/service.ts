import { and, eq } from "drizzle-orm";
import {
  publyaAccounts,
  publyaCampaignDaily,
  publyaCampaignSnapshots,
  publyaCampaigns,
  publyaGroupPerformance,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { decryptSecret, encryptSecret } from "../rdstation/crypto";
import { PUBLYA_GROUP_TYPES, type PublyaCampaignDetail, type PublyaCampaignItem, type PublyaDailyPayload, type PublyaMetricSet } from "./types";

const DEFAULT_API_BASE = "https://api.publya.com/kermit/leap";
const DEFAULT_CLIENT_ID = 810;
const DEFAULT_EMAIL = "rodrigo.cordova@bbro.com.br";

function apiConfig() {
  const clientId = Number(process.env.PUBLYA_CLIENT_ID ?? DEFAULT_CLIENT_ID);
  const email = String(process.env.PUBLYA_EMAIL ?? DEFAULT_EMAIL).trim().toLowerCase();
  const baseUrl = String(process.env.PUBLYA_API_BASE_URL ?? DEFAULT_API_BASE).replace(/\/$/, "");
  if (!Number.isInteger(clientId) || clientId < 1 || !email) throw new Error("Configuração da Publya inválida.");
  return { clientId, email, baseUrl };
}

function numeric(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateAtNoon(value?: string | null) {
  if (!value) return null;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00.000Z` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function periodBoundary(value: string, end = false) {
  return new Date(`${value}T${end ? "23:59:59" : "00:00:00"}-03:00`);
}

function normalizedMetrics(metrics?: PublyaMetricSet | null) {
  return {
    impressions: Math.round(numeric(metrics?.impressions)),
    reach: Math.round(numeric(metrics?.reach)),
    clicks: Math.round(numeric(metrics?.clicks)),
    spend: numeric(metrics?.spend),
    conversions: numeric(metrics?.conversion?.conversions),
    leads: numeric(metrics?.conversion?.leads),
    ctr: numeric(metrics?.ctr),
    cpm: numeric(metrics?.cpm),
    cpc: numeric(metrics?.cpc),
    viewability: numeric(metrics?.viewability),
  };
}

async function publicTokenExchange(temporaryToken: string) {
  const { clientId, email, baseUrl } = apiConfig();
  const response = await fetch(`${baseUrl}/reports/external/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ temporaryToken, email, clientId }),
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => null) as { token?: string; message?: string } | null;
  if (!response.ok || !payload?.token) throw new Error(response.status === 400 ? "Token temporário inválido, expirado ou já utilizado." : `Publya respondeu HTTP ${response.status}.`);
  return payload.token;
}

async function permanentToken() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const { clientId } = apiConfig();
  const account = (await db.select().from(publyaAccounts).where(eq(publyaAccounts.clientId, clientId)).limit(1))[0];
  if (!account?.permanentTokenCiphertext) throw new Error("Token permanente da Publya ainda não configurado.");
  return decryptSecret(account.permanentTokenCiphertext);
}

async function publyaGet<T>(path: string, query?: Record<string, string | number>) {
  const { clientId, email, baseUrl } = apiConfig();
  const url = new URL(`${baseUrl}/${path.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, String(value));
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${await permanentToken()}`,
      "User-Data": Buffer.from(`${clientId}:${email}`).toString("base64"),
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Publya respondeu HTTP ${response.status} em ${url.pathname}.`);
  return await response.json() as T;
}

export async function exchangeAndStorePublyaToken(temporaryToken: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const { clientId, email } = apiConfig();
  const token = await publicTokenExchange(temporaryToken);
  await db.insert(publyaAccounts).values({
    clientId,
    email,
    permanentTokenCiphertext: encryptSecret(token),
    status: "pronta",
    lastError: null,
  }).onDuplicateKeyUpdate({ set: {
    email,
    permanentTokenCiphertext: encryptSecret(token),
    status: "pronta",
    lastError: null,
  } });
  return { success: true } as const;
}

async function listCampaigns() {
  const campaigns: PublyaCampaignItem[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const payload = await publyaGet<{ total?: number; pages?: number; items?: PublyaCampaignItem[] }>("v2/reports/external/campaigns", { page, itemsPerPage: 100 });
    campaigns.push(...(payload.items ?? []));
    if (page >= numeric(payload.pages) || campaigns.length >= numeric(payload.total)) break;
  }
  return campaigns;
}

function dailyRows(payload: PublyaDailyPayload) {
  const metricNames = ["impressions", "reach", "clicks", "spend", "conversions", "leads", "ctr", "cpm", "cpc", "viewability"] as const;
  const rows = new Map<string, Record<string, number>>();
  for (const metric of metricNames) {
    const series = Array.isArray(payload[metric]) ? payload[metric] as Array<{ date?: string; value?: unknown }> : [];
    for (const point of series) {
      if (!point?.date || !/^\d{4}-\d{2}-\d{2}$/.test(point.date)) continue;
      const row = rows.get(point.date) ?? {};
      row[metric] = numeric(point.value);
      rows.set(point.date, row);
    }
  }
  return rows;
}

export async function syncPublyaPeriod(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const { clientId, email } = apiConfig();
  const periodStart = periodBoundary(startDate);
  const periodEnd = periodBoundary(endDate, true);
  await db.insert(publyaAccounts).values({ clientId, email, status: "sincronizando" }).onDuplicateKeyUpdate({ set: { email, status: "sincronizando", lastError: null } });

  try {
    const campaigns = await listCampaigns();
    let latestDataDate: Date | null = null;
    for (const campaign of campaigns) {
      await db.insert(publyaCampaigns).values({
        clientId,
        campaignId: campaign.id,
        name: campaign.name || `Campanha ${campaign.id}`,
        platformId: campaign.platform?.id ?? null,
        platformName: campaign.platform?.name ?? null,
        startDate: dateAtNoon(campaign.startDate),
        endDate: dateAtNoon(campaign.endDate),
        campaignStatus: campaign.status ?? null,
        currency: "BRL",
        rawPayload: JSON.stringify(campaign),
        syncedAt: new Date(),
      }).onDuplicateKeyUpdate({ set: {
        name: campaign.name || `Campanha ${campaign.id}`,
        platformId: campaign.platform?.id ?? null,
        platformName: campaign.platform?.name ?? null,
        startDate: dateAtNoon(campaign.startDate),
        endDate: dateAtNoon(campaign.endDate),
        campaignStatus: campaign.status ?? null,
        rawPayload: JSON.stringify(campaign),
        syncedAt: new Date(),
      } });

      const [detail, daily] = await Promise.all([
        publyaGet<PublyaCampaignDetail>(`v2/reports/external/campaigns/${campaign.id}`, { startDate, endDate }),
        publyaGet<PublyaDailyPayload>(`v2/reports/external/campaigns/${campaign.id}/daily`, { startDate, endDate }),
      ]);
      const totals = normalizedMetrics(detail.metrics);
      await db.insert(publyaCampaignSnapshots).values({ clientId, campaignId: campaign.id, periodStart, periodEnd, ...totals, rawPayload: JSON.stringify(detail.metrics ?? {}), syncedAt: new Date() }).onDuplicateKeyUpdate({ set: { ...totals, rawPayload: JSON.stringify(detail.metrics ?? {}), syncedAt: new Date() } });

      for (const [date, values] of Array.from(dailyRows(daily).entries())) {
        const reportDate = dateAtNoon(date);
        if (!reportDate) continue;
        if (!latestDataDate || reportDate > latestDataDate) latestDataDate = reportDate;
        const row = {
          impressions: Math.round(numeric(values.impressions)), reach: Math.round(numeric(values.reach)), clicks: Math.round(numeric(values.clicks)), spend: numeric(values.spend),
          conversions: numeric(values.conversions), leads: numeric(values.leads), ctr: numeric(values.ctr), cpm: numeric(values.cpm), cpc: numeric(values.cpc), viewability: numeric(values.viewability),
        };
        await db.insert(publyaCampaignDaily).values({ clientId, campaignId: campaign.id, reportDate, ...row, rawPayload: JSON.stringify({ date, ...values }), syncedAt: new Date() }).onDuplicateKeyUpdate({ set: { ...row, rawPayload: JSON.stringify({ date, ...values }), syncedAt: new Date() } });
      }

      await db.delete(publyaGroupPerformance).where(and(
        eq(publyaGroupPerformance.clientId, clientId),
        eq(publyaGroupPerformance.campaignId, campaign.id),
        eq(publyaGroupPerformance.periodStart, periodStart),
        eq(publyaGroupPerformance.periodEnd, periodEnd),
      ));
      for (const groupType of PUBLYA_GROUP_TYPES) {
        for (const item of detail.groups?.[groupType] ?? []) {
          const name = String(item.name ?? "Não identificado").trim() || "Não identificado";
          await db.insert(publyaGroupPerformance).values({
            clientId, campaignId: campaign.id, groupType, groupName: name, periodStart, periodEnd,
            ...normalizedMetrics(item.metrics), rawPayload: JSON.stringify(item), syncedAt: new Date(),
          }).onDuplicateKeyUpdate({ set: { ...normalizedMetrics(item.metrics), rawPayload: JSON.stringify(item), syncedAt: new Date() } });
        }
      }
    }

    await db.update(publyaAccounts).set({ status: "pronta", lastSyncAt: new Date(), lastDataDate: latestDataDate, lastError: null }).where(eq(publyaAccounts.clientId, clientId));
    return { campaigns: campaigns.length, lastDataDate: latestDataDate?.toISOString().slice(0, 10) ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido na sincronização Publya.";
    await db.update(publyaAccounts).set({ status: "erro", lastError: message }).where(eq(publyaAccounts.clientId, clientId));
    throw error;
  }
}

export async function publyaConnectionStatus() {
  const db = await getDb();
  if (!db) return { configured: false, status: "desconectada" as const, lastSyncAt: null, lastDataDate: null, lastError: "Banco indisponível." };
  const { clientId } = apiConfig();
  const account = (await db.select().from(publyaAccounts).where(eq(publyaAccounts.clientId, clientId)).limit(1))[0];
  return {
    configured: Boolean(account?.permanentTokenCiphertext),
    status: account?.status ?? "desconectada",
    lastSyncAt: account?.lastSyncAt ?? null,
    lastDataDate: account?.lastDataDate ?? null,
    lastError: account?.lastError ?? null,
  };
}

export const publyaInternals = { normalizedMetrics, dailyRows, periodBoundary };
