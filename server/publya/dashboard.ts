import { and, asc, eq, gte, lte } from "drizzle-orm";
import { publyaAccounts, publyaCampaignDaily, publyaCampaignSnapshots, publyaCampaigns, publyaGroupPerformance, publyaPushCampaigns, publyaPushDaily } from "../../drizzle/schema";
import { getDb } from "../db";

const OFFICIAL_REPORT_URLS: Record<number, string> = {
  7058: "https://portal.publya.com/report/campaign/medsystems/v2/0325c3c0-b079-4ef3-96c2-3d32d98152d8",
  7069: "https://portal.publya.com/report/campaign/medsystems/v2/3aa78e35-98c9-4815-a2d0-a852ce09944f",
  7083: "https://portal.publya.com/report/campaign/medsystems/v2/114f5f44-0df7-4752-8155-093f03cb96e9",
  7059: "https://portal.publya.com/report/campaign/medsystems/v2/4b357f73-70d6-4737-824b-80579caaff6b",
};
const PUSH_REPORT_KEY = "push:medsystems/b2b/xr50xt2cwdhc";

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

function reportMetadata(campaign: { name: string; platformName: string | null }) {
  const platform = campaign.platformName ?? "Não identificado";
  if (/google/i.test(platform)) return { reportType: "PMAX", objective: "Conversões" };
  if (/meta/i.test(platform)) return { reportType: "Meta", objective: "Geração de Cadastros" };
  if (isProgrammaticPlatform(platform) && /geo/i.test(campaign.name)) return { reportType: "Programática Display", objective: "Alcance" };
  if (isProgrammaticPlatform(platform)) return { reportType: "Programática Display", objective: "Conversões" };
  return { reportType: platform, objective: "Não identificado" };
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

export async function programmaticDashboard(input: { startDate: string; endDate: string; campaignId?: number; reportKey?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const clientId = Number(process.env.PUBLYA_CLIENT_ID ?? 810);
  const start = brtBoundary(input.startDate);
  const end = brtBoundary(input.endDate, true);
  const account = (await db.select().from(publyaAccounts).where(eq(publyaAccounts.clientId, clientId)).limit(1))[0];
  const allCampaignRows = await db.select().from(publyaCampaigns).where(eq(publyaCampaigns.clientId, clientId)).orderBy(asc(publyaCampaigns.name));
  const campaignRows = allCampaignRows;
  const reportCampaignId = input.reportKey?.startsWith("campaign:") ? Number(input.reportKey.slice("campaign:".length)) : undefined;
  const selectedCampaignId = Number.isInteger(reportCampaignId) && Number(reportCampaignId) > 0 ? Number(reportCampaignId) : input.campaignId;
  const pushOnly = input.reportKey === PUSH_REPORT_KEY;
  const includePush = !input.reportKey || input.reportKey === "all" || pushOnly;
  const selectedCampaignIds = pushOnly ? [] : selectedCampaignId ? [selectedCampaignId] : campaignRows.map(row => row.campaignId);
  const selectedIdSet = new Set(selectedCampaignIds);

  const snapshotCandidates = selectedCampaignIds.length ? (await db.select().from(publyaCampaignSnapshots).where(and(
    eq(publyaCampaignSnapshots.clientId, clientId),
    eq(publyaCampaignSnapshots.periodStart, start),
    eq(publyaCampaignSnapshots.periodEnd, end),
    selectedCampaignId ? eq(publyaCampaignSnapshots.campaignId, selectedCampaignId) : undefined,
  ))).filter(row => selectedIdSet.has(row.campaignId)) : [];
  const { counted: snapshots, duplicates } = dedupeSnapshots(snapshotCandidates);
  const countedIdSet = new Set(snapshots.map(row => row.campaignId));
  const daily = selectedCampaignIds.length ? (await db.select().from(publyaCampaignDaily).where(and(
    eq(publyaCampaignDaily.clientId, clientId),
    gte(publyaCampaignDaily.reportDate, start),
    lte(publyaCampaignDaily.reportDate, end),
    selectedCampaignId ? eq(publyaCampaignDaily.campaignId, selectedCampaignId) : undefined,
  )).orderBy(asc(publyaCampaignDaily.reportDate))).filter(row => countedIdSet.has(row.campaignId)) : [];
  const groupRows = snapshots.length ? await db.select().from(publyaGroupPerformance).where(and(
    eq(publyaGroupPerformance.clientId, clientId),
    eq(publyaGroupPerformance.periodStart, start),
    eq(publyaGroupPerformance.periodEnd, end),
    selectedCampaignId ? eq(publyaGroupPerformance.campaignId, selectedCampaignId) : undefined,
  )) : [];
  const groups = groupRows.filter(row => countedIdSet.has(row.campaignId));

  const pushCampaign = includePush ? (await db.select().from(publyaPushCampaigns).where(eq(publyaPushCampaigns.clientId, clientId)).limit(1))[0] : undefined;
  const pushRows = includePush ? await db.select().from(publyaPushDaily).where(and(
    eq(publyaPushDaily.clientId, clientId),
    gte(publyaPushDaily.reportDate, start),
    lte(publyaPushDaily.reportDate, end),
  )).orderBy(asc(publyaPushDaily.reportDate)) : [];
  const pushTotals = pushRows.reduce((sum, row) => ({
    spend: sum.spend + numeric(row.spend),
    sends: sum.sends + numeric(row.sends),
    clicks: sum.clicks + numeric(row.clicks),
  }), { spend: 0, sends: 0, clicks: 0 });

  const campaignName = new Map(campaignRows.map(row => [row.campaignId, row.name]));
  const campaignTotals = snapshots.reduce((sum, row) => ({
    spend: sum.spend + numeric(row.spend),
    impressions: sum.impressions + numeric(row.impressions),
    reach: sum.reach + numeric(row.reach),
    clicks: sum.clicks + numeric(row.clicks),
    conversions: sum.conversions + numeric(row.conversions),
    leads: sum.leads + numeric(row.leads),
  }), { spend: 0, impressions: 0, reach: 0, clicks: 0, conversions: 0, leads: 0 });
  const totals = {
    ...campaignTotals,
    spend: campaignTotals.spend + pushTotals.spend,
    clicks: campaignTotals.clicks + pushTotals.clicks,
    sends: pushTotals.sends,
    pushClicks: pushTotals.clicks,
    mediaClicks: campaignTotals.clicks,
  };

  const byDayMap = new Map<string, { date: string; impressions: number; clicks: number; spend: number; leads: number; conversions: number; sends: number }>();
  for (const row of daily) {
    const date = new Date(row.reportDate).toISOString().slice(0, 10);
    const current = byDayMap.get(date) ?? { date, impressions: 0, clicks: 0, spend: 0, leads: 0, conversions: 0, sends: 0 };
    current.impressions += numeric(row.impressions);
    current.clicks += numeric(row.clicks);
    current.spend += numeric(row.spend);
    current.leads += numeric(row.leads);
    current.conversions += numeric(row.conversions);
    if (current.impressions || current.clicks || current.spend || current.leads || current.conversions) byDayMap.set(date, current);
  }
  for (const row of pushRows) {
    const date = new Date(row.reportDate).toISOString().slice(0, 10);
    const current = byDayMap.get(date) ?? { date, impressions: 0, clicks: 0, spend: 0, leads: 0, conversions: 0, sends: 0 };
    current.clicks += numeric(row.clicks);
    current.spend += numeric(row.spend);
    current.sends = numeric(current.sends) + numeric(row.sends);
    byDayMap.set(date, current);
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
    period: { start: input.startDate, end: input.endDate, exactSnapshotAvailable: snapshotCandidates.length > 0 || pushRows.length > 0 },
    totals: {
      ...totals,
      ctr: campaignTotals.impressions > 0 ? (campaignTotals.clicks / campaignTotals.impressions) * 100 : 0,
      cpm: campaignTotals.impressions > 0 ? (campaignTotals.spend / campaignTotals.impressions) * 1000 : 0,
      cpc: campaignTotals.clicks > 0 ? campaignTotals.spend / campaignTotals.clicks : 0,
      pushCtr: pushTotals.sends > 0 ? (pushTotals.clicks / pushTotals.sends) * 100 : 0,
      pushCpd: pushTotals.sends > 0 ? pushTotals.spend / pushTotals.sends : 0,
    },
    campaigns: snapshotCandidates.map(row => {
      const campaign = campaignRows.find(item => item.campaignId === row.campaignId);
      const metadata = reportMetadata({ name: campaign?.name ?? `Campanha ${row.campaignId}`, platformName: campaign?.platformName ?? null });
      return {
      reportKey: `campaign:${row.campaignId}`,
      campaignId: row.campaignId,
      campaignName: campaignName.get(row.campaignId) ?? `Campanha ${row.campaignId}`,
      platform: campaign?.platformName ?? "Não identificado",
      reportType: metadata.reportType,
      objective: metadata.objective,
      startDate: campaign?.startDate ?? null,
      endDate: campaign?.endDate ?? null,
      status: campaign?.campaignStatus ?? "unknown",
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
      reportUrl: OFFICIAL_REPORT_URLS[row.campaignId] ?? null,
      dataDate: input.endDate,
    };
    }).sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0)),
    push: pushCampaign ? {
      reportKey: PUSH_REPORT_KEY,
      campaignName: pushCampaign.name,
      reportType: pushCampaign.mediaType,
      objective: "Disparos e Cliques",
      startDate: pushCampaign.periodStart,
      endDate: pushCampaign.periodEnd,
      status: pushCampaign.periodEnd && pushCampaign.periodEnd.getTime() >= Date.now() ? "active" : "ended",
      spend: pushTotals.spend,
      sends: pushTotals.sends,
      clicks: pushTotals.clicks,
      ctr: pushTotals.sends > 0 ? (pushTotals.clicks / pushTotals.sends) * 100 : 0,
      cpd: pushTotals.sends > 0 ? pushTotals.spend / pushTotals.sends : 0,
      contractedBudget: numeric(pushCampaign.contractedBudget),
      contractedSends: numeric(pushCampaign.contractedSends),
      reportUrl: pushCampaign.reportUrl,
      dataDate: pushCampaign.lastDataDate,
      sourceUpdatedAt: pushCampaign.sourceUpdatedAt,
    } : null,
    reportOptions: [
      ...campaignRows.map(row => ({ reportKey: `campaign:${row.campaignId}`, name: row.name, platform: row.platformName, status: row.campaignStatus, ...reportMetadata(row) })),
      ...(pushCampaign ? [{ reportKey: PUSH_REPORT_KEY, name: pushCampaign.name, platform: pushCampaign.mediaType, status: "active", reportType: "Push Notification", objective: "Disparos e Cliques" }] : []),
    ],
    byDay: Array.from(byDayMap.values()),
    formats: aggregateGroups("formats"),
    creatives: aggregateGroups("creatives"),
    sites: aggregateGroups("sites"),
    publishers: aggregateGroups("publishers"),
    quality: { duplicateSnapshots: duplicates.size, reachReliable: duplicates.size === 0 },
    warnings: duplicates.size ? [`A API Publya retornou investimento, impressões, cliques e custos idênticos para as duas campanhas Programática Display no mesmo período, enquanto o alcance variou entre chamadas. Os quatro relatórios permanecem visíveis, mas apenas uma ocorrência desse snapshot duplicado entra nos KPIs e o alcance consolidado fica indisponível.`] : [],
    methodology: "Dados de cinco relatórios B2B: PMAX, Meta e duas campanhas de Programática Display pela API Publya v2, além do Push pela RPC pública estruturada do relatório oficial. Investimento e cliques são somados; impressões e disparos permanecem separados por terem denominadores diferentes. Respostas idênticas entre campanhas não são somadas e nenhuma métrica ausente é estimada.",
  };
}

export const publyaDashboardInternals = { isProgrammaticPlatform, reportMetadata, snapshotSignature, dedupeSnapshots };
