import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { mediaDailyPerformance } from "../../drizzle/schema";
import { getDb } from "../db";
import { dedupeCanonicalCampaignRows, sumCampaignMetrics } from "./canonicalCampaignRows";
import { META_ACTIVE_AD_IDS, META_ACTIVE_STATUS_AS_OF, META_CAMPAIGN_PREVIEWS } from "./metaActiveAdsSnapshot";

export type MediaDashboardPlatform = "google_ads" | "meta_ads";
export type MediaDashboardBrand = "all" | "medsystems" | "beautysystems";

function numeric(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function localDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export function validateMediaDateRange(startDate: string, endDate: string) {
  const valid = /^\d{4}-\d{2}-\d{2}$/;
  if (!valid.test(startDate) || !valid.test(endDate)) throw new Error("Informe as datas no formato AAAA-MM-DD.");
  if (startDate > endDate) throw new Error("A data inicial não pode ser posterior à data final.");
  const start = new Date(`${startDate}T00:00:00-03:00`);
  const endExclusive = new Date(`${endDate}T00:00:00-03:00`);
  endExclusive.setDate(endExclusive.getDate() + 1);
  return { start, endExclusive };
}

export async function mediaChannelDashboard(input: {
  platform: MediaDashboardPlatform;
  brand: MediaDashboardBrand;
  startDate: string;
  endDate: string;
  campaignId?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const { start, endExclusive } = validateMediaDateRange(input.startDate, input.endDate);
  const brands = input.brand === "all" ? ["medsystems", "beautysystems"] as const : [input.brand] as const;
  const campaignBaseWhere = and(
    eq(mediaDailyPerformance.recordLevel, "campaign"),
    eq(mediaDailyPerformance.platform, input.platform),
    inArray(mediaDailyPerformance.brand, brands),
    gte(mediaDailyPerformance.reportDate, start),
    lt(mediaDailyPerformance.reportDate, endExclusive),
  );
  const rawCampaignRows = await db.select({
    id: mediaDailyPerformance.id,
    platform: mediaDailyPerformance.platform,
    brand: mediaDailyPerformance.brand,
    accountId: mediaDailyPerformance.accountId,
    reportDate: mediaDailyPerformance.reportDate,
    campaignId: mediaDailyPerformance.campaignId,
    campaignName: mediaDailyPerformance.campaignName,
    spend: mediaDailyPerformance.spend,
    impressions: mediaDailyPerformance.impressions,
    reach: mediaDailyPerformance.reach,
    clicks: mediaDailyPerformance.clicks,
    leads: mediaDailyPerformance.platformLeads,
    rawPayload: mediaDailyPerformance.rawPayload,
    syncedAt: mediaDailyPerformance.syncedAt,
  }).from(mediaDailyPerformance).where(campaignBaseWhere);
  const canonicalBaseRows = dedupeCanonicalCampaignRows(rawCampaignRows);
  const canonicalRows = input.campaignId
    ? canonicalBaseRows.filter(row => row.campaignId === input.campaignId)
    : canonicalBaseRows;
  const totals = sumCampaignMetrics(canonicalRows);
  const spend = totals.spend;
  const leads = totals.leads;
  const impressions = totals.impressions;
  const clicks = totals.clicks;

  const byDayMap = new Map<string, { date: string; spend: number; leads: number }>();
  const campaignMap = new Map<string, { campaignId: string; campaignName: string; brand: "medsystems" | "beautysystems"; spend: number; impressions: number; clicks: number; leads: number }>();
  const optionMap = new Map<string, { campaignId: string; campaignName: string; brand: "medsystems" | "beautysystems"; spend: number }>();
  for (const row of canonicalRows) {
    const date = localDate(row.reportDate);
    const day = byDayMap.get(date) ?? { date, spend: 0, leads: 0 };
    day.spend += numeric(row.spend);
    day.leads += numeric(row.leads);
    byDayMap.set(date, day);
    const key = `${row.brand}|${row.campaignId}`;
    const campaign = campaignMap.get(key) ?? { campaignId: row.campaignId, campaignName: row.campaignName ?? "Sem nome", brand: row.brand, spend: 0, impressions: 0, clicks: 0, leads: 0 };
    campaign.spend += numeric(row.spend);
    campaign.impressions += numeric(row.impressions);
    campaign.clicks += numeric(row.clicks);
    campaign.leads += numeric(row.leads);
    campaignMap.set(key, campaign);
  }
  for (const row of canonicalBaseRows) {
    const key = `${row.brand}|${row.campaignId}`;
    const option = optionMap.get(key) ?? { campaignId: row.campaignId, campaignName: row.campaignName ?? "Sem nome", brand: row.brand, spend: 0 };
    option.spend += numeric(row.spend);
    optionMap.set(key, option);
  }
  const campaigns = Array.from(campaignMap.values()).sort((a, b) => b.spend - a.spend).map(row => ({
    ...row,
    cpl: row.leads > 0 ? row.spend / row.leads : null,
    spendShare: spend > 0 ? (row.spend / spend) * 100 : 0,
  }));
  const campaignOptions = Array.from(optionMap.values()).sort((a, b) => b.spend - a.spend);
  const coverageDates = canonicalBaseRows.map(row => new Date(row.reportDate).getTime()).filter(Number.isFinite);

  const activeIds = Array.from(META_ACTIVE_AD_IDS);
  const activeCreatives = input.platform === "meta_ads" && activeIds.length
    ? await db.select({
      campaignId: mediaDailyPerformance.campaignId,
      campaignName: mediaDailyPerformance.campaignName,
      brand: mediaDailyPerformance.brand,
      adId: mediaDailyPerformance.adId,
      adName: mediaDailyPerformance.adName,
      lastMetricDate: sql<Date>`max(${mediaDailyPerformance.reportDate})`,
    }).from(mediaDailyPerformance).where(and(
      eq(mediaDailyPerformance.recordLevel, "ad"),
      eq(mediaDailyPerformance.platform, "meta_ads"),
      inArray(mediaDailyPerformance.brand, brands),
      inArray(mediaDailyPerformance.adId, activeIds),
      input.campaignId ? eq(mediaDailyPerformance.campaignId, input.campaignId) : undefined,
    )).groupBy(
      mediaDailyPerformance.campaignId,
      mediaDailyPerformance.campaignName,
      mediaDailyPerformance.brand,
      mediaDailyPerformance.adId,
      mediaDailyPerformance.adName,
    ).orderBy(desc(sql`max(${mediaDailyPerformance.reportDate})`))
    : [];

  const topThreeSpend = campaigns.slice(0, 3).reduce((sum, row) => sum + row.spend, 0);
  return {
    platform: input.platform,
    selectedBrand: input.brand,
    selectedCampaignId: input.campaignId ?? "all",
    period: {
      start: input.startDate,
      end: input.endDate,
      dataStart: coverageDates.length ? localDate(new Date(Math.min(...coverageDates))) : null,
      dataEnd: coverageDates.length ? localDate(new Date(Math.max(...coverageDates))) : null,
    },
    totals: {
      spend,
      leads,
      impressions,
      clicks,
      cpl: leads > 0 ? spend / leads : null,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : null,
      campaigns: campaigns.length,
      activeCreatives: activeCreatives.length,
    },
    byDay: Array.from(byDayMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    campaigns,
    campaignOptions,
    activeCreatives: activeCreatives.map(row => ({
      campaignId: row.campaignId,
      campaignName: row.campaignName ?? "Sem nome",
      brand: row.brand,
      adId: row.adId ?? "",
      adName: row.adName ?? "Sem nome",
      effectiveStatus: "ACTIVE" as const,
      statusAsOf: META_ACTIVE_STATUS_AS_OF,
      previewUrl: META_CAMPAIGN_PREVIEWS[row.campaignId]?.adId === row.adId ? META_CAMPAIGN_PREVIEWS[row.campaignId]?.previewUrl ?? null : null,
      metricsThrough: row.lastMetricDate ? localDate(row.lastMetricDate) : null,
    })),
    insights: {
      topSpendCampaign: campaigns[0] ?? null,
      topLeadCampaign: [...campaigns].sort((a, b) => b.leads - a.leads || b.spend - a.spend)[0] ?? null,
      topThreeSpendShare: spend > 0 ? (topThreeSpend / spend) * 100 : 0,
      campaignsWithoutLeads: campaigns.filter(row => row.spend > 0 && row.leads <= 0).length,
    },
    methodology: {
      campaignLevelOnly: true,
      activeStatusAsOf: input.platform === "meta_ads" ? META_ACTIVE_STATUS_AS_OF : null,
      officialRecommendationsAvailable: false,
    },
  };
}
