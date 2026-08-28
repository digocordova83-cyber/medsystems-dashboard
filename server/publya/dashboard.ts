import { and, asc, eq, gte, lte } from "drizzle-orm";
import { publyaAccounts, publyaCampaignDaily, publyaCampaignSnapshots, publyaCampaigns, publyaGroupPerformance } from "../../drizzle/schema";
import { getDb } from "../db";

function brtBoundary(value: string, end = false) {
  return new Date(`${value}T${end ? "23:59:59" : "00:00:00"}-03:00`);
}

function numeric(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isProgrammaticPlatform(value: string | null | undefined) {
  return /dv360|programmatic|gama|display/i.test(value ?? "");
}

type SnapshotRow = typeof publyaCampaignSnapshots.$inferSelect;

function snapshotSignature(row: SnapshotRow) {
  return [
    numeric(row.spend).toFixed(6),
    numeric(row.impressions),
    numeric(row.clicks),
    numeric(row.ctr).toFixed(6),
    numeric(row.cpm).toFixed(6),
    numeric(row.cpc).toFixed(6),
    numeric(row.viewability).toFixed(6),
  ].join("|");
}

function dedupeSnapshots(rows: SnapshotRow[]) {
  const counted: SnapshotRow[] = [];
  const duplicates = new Map<number, number>();
  const seen = new Map<string, number>();
  for (const row of rows) {
    const signature = snapshotSignature(row);
    const original = seen.get(signature);
    if (original !== undefined) {
      duplicates.set(row.campaignId, original);
      continue;
    }
    seen.set(signature, row.campaignId);
    counted.push(row);
  }
  return { counted, duplicates };
}

export async function programmaticDashboard(input: { startDate: string; endDate: string; campaignId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const clientId = Number(process.env.PUBLYA_CLIENT_ID ?? 810);
  const start = brtBoundary(input.startDate);
  const end = brtBoundary(input.endDate, true);
  const account = (await db.select().from(publyaAccounts).where(eq(publyaAccounts.clientId, clientId)).limit(1))[0];
  const allCampaignRows = await db.select().from(publyaCampaigns).where(eq(publyaCampaigns.clientId, clientId)).orderBy(asc(publyaCampaigns.name));
  const campaignRows = allCampaignRows.filter(row => isProgrammaticPlatform(row.platformName));
  const selectedCampaignIds = input.campaignId ? [input.campaignId] : campaignRows.map(row => row.campaignId);
  const selectedIdSet = new Set(selectedCampaignIds);

  const snapshotCandidates = selectedCampaignIds.length ? (await db.select().from(publyaCampaignSnapshots).where(and(
    eq(publyaCampaignSnapshots.clientId, clientId),
    eq(publyaCampaignSnapshots.periodStart, start),
    eq(publyaCampaignSnapshots.periodEnd, end),
    input.campaignId ? eq(publyaCampaignSnapshots.campaignId, input.campaignId) : undefined,
  ))).filter(row => selectedIdSet.has(row.campaignId)) : [];
  const { counted: snapshots, duplicates } = dedupeSnapshots(snapshotCandidates);
  const countedIdSet = new Set(snapshots.map(row => row.campaignId));
  const daily = selectedCampaignIds.length ? (await db.select().from(publyaCampaignDaily).where(and(
    eq(publyaCampaignDaily.clientId, clientId),
    gte(publyaCampaignDaily.reportDate, start),
    lte(publyaCampaignDaily.reportDate, end),
    input.campaignId ? eq(publyaCampaignDaily.campaignId, input.campaignId) : undefined,
  )).orderBy(asc(publyaCampaignDaily.reportDate))).filter(row => countedIdSet.has(row.campaignId)) : [];
  const groupRows = snapshots.length ? await db.select().from(publyaGroupPerformance).where(and(
    eq(publyaGroupPerformance.clientId, clientId),
    eq(publyaGroupPerformance.periodStart, start),
    eq(publyaGroupPerformance.periodEnd, end),
    input.campaignId ? eq(publyaGroupPerformance.campaignId, input.campaignId) : undefined,
  )) : [];
  const groups = groupRows.filter(row => countedIdSet.has(row.campaignId));

  const campaignName = new Map(campaignRows.map(row => [row.campaignId, row.name]));
  const totals = snapshots.reduce((sum, row) => ({
    spend: sum.spend + numeric(row.spend),
    impressions: sum.impressions + numeric(row.impressions),
    reach: sum.reach + numeric(row.reach),
    clicks: sum.clicks + numeric(row.clicks),
    conversions: sum.conversions + numeric(row.conversions),
    leads: sum.leads + numeric(row.leads),
  }), { spend: 0, impressions: 0, reach: 0, clicks: 0, conversions: 0, leads: 0 });

  const byDayMap = new Map<string, { date: string; impressions: number; clicks: number; spend: number; leads: number; conversions: number }>();
  for (const row of daily) {
    const date = new Date(row.reportDate).toISOString().slice(0, 10);
    const current = byDayMap.get(date) ?? { date, impressions: 0, clicks: 0, spend: 0, leads: 0, conversions: 0 };
    current.impressions += numeric(row.impressions);
    current.clicks += numeric(row.clicks);
    current.spend += numeric(row.spend);
    current.leads += numeric(row.leads);
    current.conversions += numeric(row.conversions);
    if (current.impressions || current.clicks || current.spend || current.leads || current.conversions) byDayMap.set(date, current);
  }

  const aggregateGroups = (type: string) => {
    const map = new Map<string, { name: string; impressions: number; clicks: number; spend: number; reach: number; viewabilitySum: number; viewabilityWeight: number }>();
    for (const row of groups.filter(item => item.groupType === type)) {
      const current = map.get(row.groupName) ?? { name: row.groupName, impressions: 0, clicks: 0, spend: 0, reach: 0, viewabilitySum: 0, viewabilityWeight: 0 };
      current.impressions += numeric(row.impressions);
      current.clicks += numeric(row.clicks);
      current.spend += numeric(row.spend);
      current.reach += numeric(row.reach);
      current.viewabilitySum += numeric(row.viewability) * Math.max(1, numeric(row.impressions));
      current.viewabilityWeight += Math.max(1, numeric(row.impressions));
      map.set(row.groupName, current);
    }
    return Array.from(map.values()).map(row => ({
      name: row.name,
      impressions: row.impressions,
      clicks: row.clicks,
      spend: row.spend,
      reach: row.reach,
      ctr: row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0,
      viewability: row.viewabilityWeight > 0 ? row.viewabilitySum / row.viewabilityWeight : 0,
    })).sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
  };

  return {
    connection: {
      configured: Boolean(account?.permanentTokenCiphertext),
      status: account?.status ?? "desconectada",
      lastSyncAt: account?.lastSyncAt ?? null,
      lastDataDate: account?.lastDataDate ?? null,
      lastError: account?.lastError ?? null,
    },
    period: { start: input.startDate, end: input.endDate, exactSnapshotAvailable: snapshotCandidates.length > 0 },
    totals: {
      ...totals,
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
      cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    },
    campaigns: snapshotCandidates.map(row => ({
      campaignId: row.campaignId,
      campaignName: campaignName.get(row.campaignId) ?? `Campanha ${row.campaignId}`,
      spend: numeric(row.spend),
      impressions: numeric(row.impressions),
      clicks: numeric(row.clicks),
      reach: numeric(row.reach),
      leads: numeric(row.leads),
      conversions: numeric(row.conversions),
      ctr: numeric(row.ctr),
      cpm: numeric(row.cpm),
      viewability: numeric(row.viewability),
      counted: countedIdSet.has(row.campaignId),
      duplicateOf: duplicates.get(row.campaignId) ?? null,
    })).sort((a, b) => b.impressions - a.impressions),
    campaignOptions: campaignRows.map(row => ({ campaignId: row.campaignId, name: row.name, platform: row.platformName, status: row.campaignStatus })),
    byDay: Array.from(byDayMap.values()),
    formats: aggregateGroups("formats"),
    creatives: aggregateGroups("creatives"),
    sites: aggregateGroups("sites"),
    publishers: aggregateGroups("publishers"),
    quality: { duplicateSnapshots: duplicates.size, reachReliable: duplicates.size === 0 },
    warnings: duplicates.size ? [`A API Publya retornou investimento, impressões, cliques e custos idênticos para ${duplicates.size + 1} campanhas DV360 no mesmo período, enquanto o alcance variou entre chamadas. As duas linhas permanecem visíveis para auditoria, mas apenas uma ocorrência entra nos KPIs e o alcance consolidado fica indisponível.`] : [],
    methodology: "Dados exclusivos de campanhas programáticas da API Publya v2. Google Ads e Meta Ads retornados pela conta são excluídos desta aba. Totais usam snapshot exato do período; respostas idênticas entre campanhas não são somadas e nenhuma métrica ausente é estimada.",
  };
}

export const publyaDashboardInternals = { isProgrammaticPlatform, snapshotSignature, dedupeSnapshots };
