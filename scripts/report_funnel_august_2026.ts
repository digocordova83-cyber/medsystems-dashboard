import { and, gte, lt, eq, like } from "drizzle-orm";
import { getDb } from "../server/db";
import { bitrix24Entities, mediaDailyPerformance } from "../drizzle/schema";
import { buildRdOpportunityManagerDashboard } from "../server/bitrix24/rdOpportunityAnalytics";

const portal = new URL(process.env.BITRIX24_MEDSYSTEMS_WEBHOOK_BASE_URL!).host;
const filters = { pipeline: "all", responsible: "all", source: "all", stage: "all", position: "all", product: "all", campaign: "all", adset: "all", creative: "all" } as const;
const periods = [
  { key: "2026-07", start: "2026-07-01", end: "2026-07-31", startAt: "2026-07-01T00:00:00-03:00", endAt: "2026-08-01T00:00:00-03:00" },
  { key: "2026-08-mtd", start: "2026-08-01", end: "2026-08-26", startAt: "2026-08-01T00:00:00-03:00", endAt: "2026-08-27T00:00:00-03:00" },
] as const;
const pipelines = { all: "all", medsystems: "15391", beautysystems: "15395" } as const;

const db = await getDb();
if (!db) throw new Error("Banco indisponível");
const allLeads = await db.select({ bitrixId: bitrix24Entities.bitrixId, createdAtBitrix: bitrix24Entities.createdAtBitrix, stageOrStatus: bitrix24Entities.stageOrStatus, rawPayload: bitrix24Entities.rawPayload }).from(bitrix24Entities).where(and(eq(bitrix24Entities.portal, portal), eq(bitrix24Entities.entityType, "lead"), gte(bitrix24Entities.createdAtBitrix, new Date("2026-07-01T00:00:00-03:00")), lt(bitrix24Entities.createdAtBitrix, new Date("2026-08-27T00:00:00-03:00")), like(bitrix24Entities.rawPayload, '%"UF_CRM_1744808620":"Tráfego Pago"%')));
const allDeals = await db.select({ rawPayload: bitrix24Entities.rawPayload }).from(bitrix24Entities).where(and(eq(bitrix24Entities.portal, portal), eq(bitrix24Entities.entityType, "deal"), gte(bitrix24Entities.createdAtBitrix, new Date("2026-07-01T00:00:00-03:00")), lt(bitrix24Entities.createdAtBitrix, new Date("2026-08-27T00:00:00-03:00"))));
const funnel: Record<string, unknown> = {};
for (const period of periods) {
  funnel[period.key] = {};
  const periodLeads = allLeads.filter(row => row.createdAtBitrix >= new Date(period.startAt) && row.createdAtBitrix < new Date(period.endAt));
  for (const [brand, pipeline] of Object.entries(pipelines)) {
    const result = buildRdOpportunityManagerDashboard({ rows: periodLeads, dealRows: allDeals, filters: { ...filters, pipeline }, period: { start: period.start, end: period.end } });
    funnel[period.key][brand] = { totals: result.totals, funnel: result.funnel, coverage: result.coverage, topCampaigns: result.campaigns?.slice?.(0, 10) ?? [] };
  }
}

const mediaRows = await db.select({
  id: mediaDailyPerformance.id,
  platform: mediaDailyPerformance.platform,
  brand: mediaDailyPerformance.brand,
  reportDate: mediaDailyPerformance.reportDate,
  accountId: mediaDailyPerformance.accountId,
  campaignId: mediaDailyPerformance.campaignId,
  spend: mediaDailyPerformance.spend,
  platformLeads: mediaDailyPerformance.platformLeads,
  syncedAt: mediaDailyPerformance.syncedAt,
}).from(mediaDailyPerformance).where(and(gte(mediaDailyPerformance.reportDate, new Date("2026-07-01T00:00:00-03:00")), lt(mediaDailyPerformance.reportDate, new Date("2026-08-27T00:00:00-03:00"))));
const latest = new Map<string, typeof mediaRows[number]>();
for (const row of mediaRows) {
  const key = [row.platform, row.accountId, new Date(row.reportDate).toISOString().slice(0, 10), row.campaignId].join("|");
  const existing = latest.get(key);
  if (!existing || new Date(row.syncedAt).getTime() > new Date(existing.syncedAt).getTime() || (new Date(row.syncedAt).getTime() === new Date(existing.syncedAt).getTime() && row.id > existing.id)) latest.set(key, row);
}
const media: Record<string, Record<string, { spend: number; leads: number }>> = {};
for (const period of periods) {
  media[period.key] = {};
  for (const brand of ["medsystems", "beautysystems"]) media[period.key][brand] = { spend: 0, leads: 0 };
}
for (const row of latest.values()) {
  const date = new Date(row.reportDate).toISOString().slice(0, 10);
  const period = date < "2026-08-01" ? "2026-07" : (date <= "2026-08-26" ? "2026-08-mtd" : null);
  if (period && media[period][row.brand]) {
    media[period][row.brand].spend += Number(row.spend ?? 0);
    media[period][row.brand].leads += Number(row.platformLeads ?? 0);
  }
}
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), periodNote: "Agosto é MTD até 26/08/2026; julho é mês fechado.", funnel, media }, null, 2));
