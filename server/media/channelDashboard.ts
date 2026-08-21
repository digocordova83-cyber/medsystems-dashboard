import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { mediaDailyPerformance } from "../../drizzle/schema";
import { getDb } from "../db";
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
  const campaignWhere = input.campaignId
    ? and(campaignBaseWhere, eq(mediaDailyPerformance.campaignId, input.campaignId))
    : campaignBaseWhere;

  const [totalsRows, byDayRows, campaignRows, optionRows, coverageRows] = await Promise.all([
    db.select({
      spend: sql<number>`sum(${mediaDailyPerformance.spend})`,
      impressions: sql<number>`sum(${mediaDailyPerformance.impressions})`,
      clicks: sql<number>`sum(${mediaDailyPerformance.clicks})`,
      leads: sql<number>`sum(${mediaDailyPerformance.platformLeads})`,
    }).from(mediaDailyPerformance).where(campaignWhere),
    db.select({
      date: mediaDailyPerformance.reportDate,
      spend: sql<number>`sum(${mediaDailyPerformance.spend})`,
      leads: sql<number>`sum(${mediaDailyPerformance.platformLeads})`,
    }).from(mediaDailyPerformance).where(campaignWhere).groupBy(mediaDailyPerformance.reportDate).orderBy(mediaDailyPerformance.reportDate),
    db.select({
      campaignId: mediaDailyPerformance.campaignId,
      campaignName: mediaDailyPerformance.campaignName,
      brand: mediaDailyPerformance.brand,
      spend: sql<number>`sum(${mediaDailyPerformance.spend})`,
      impressions: sql<number>`sum(${mediaDailyPerformance.impressions})`,
      clicks: sql<number>`sum(${mediaDailyPerformance.clicks})`,
      leads: sql<number>`sum(${mediaDailyPerformance.platformLeads})`,
    }).from(mediaDailyPerformance).where(campaignWhere).groupBy(
      mediaDailyPerformance.campaignId,
      mediaDailyPerformance.campaignName,
      mediaDailyPerformance.brand,
    ).orderBy(desc(sql`sum(${mediaDailyPerformance.spend})`)),
    db.select({
      campaignId: mediaDailyPerformance.campaignId,
      campaignName: mediaDailyPerformance.campaignName,
      brand: mediaDailyPerformance.brand,
      spend: sql<number>`sum(${mediaDailyPerformance.spend})`,
    }).from(mediaDailyPerformance).where(campaignBaseWhere).groupBy(
      mediaDailyPerformance.campaignId,
      mediaDailyPerformance.campaignName,
      mediaDailyPerformance.brand,
    ).orderBy(desc(sql`sum(${mediaDailyPerformance.spend})`)),
    db.select({ minDate: sql<Date>`min(${mediaDailyPerformance.reportDate})`, maxDate: sql<Date>`max(${mediaDailyPerformance.reportDate})` })
      .from(mediaDailyPerformance)
      .where(campaignBaseWhere),
  ]);

  const totals = totalsRows[0];
  const spend = numeric(totals?.spend);
  const leads = numeric(totals?.leads);
  const impressions = numeric(totals?.impressions);
  const clicks = numeric(totals?.clicks);
  const campaigns = campaignRows.map(row => ({
    campaignId: row.campaignId,
    campaignName: row.campaignName ?? "Sem nome",
    brand: row.brand,
    spend: numeric(row.spend),
    impressions: numeric(row.impressions),
    clicks: numeric(row.clicks),
    leads: numeric(row.leads),
    cpl: numeric(row.leads) > 0 ? numeric(row.spend) / numeric(row.leads) : null,
    spendShare: spend > 0 ? (numeric(row.spend) / spend) * 100 : 0,
  }));

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
      dataStart: coverageRows[0]?.minDate ? localDate(coverageRows[0].minDate) : null,
      dataEnd: coverageRows[0]?.maxDate ? localDate(coverageRows[0].maxDate) : null,
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
    byDay: byDayRows.map(row => ({ date: localDate(row.date), spend: numeric(row.spend), leads: numeric(row.leads) })),
    campaigns,
    campaignOptions: optionRows.map(row => ({ campaignId: row.campaignId, campaignName: row.campaignName ?? "Sem nome", brand: row.brand, spend: numeric(row.spend) })),
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
