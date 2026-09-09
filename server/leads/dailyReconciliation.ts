import { paidMediaReconciliationDaily } from "../../drizzle/schema";
import { getDb } from "../db";
import { medsystemsBitrixRdOpportunityDashboardsByAccount } from "../bitrix24/service";

const DEFAULT_FILTERS = {
  pipeline: "all", responsible: "all", source: "all", stage: "all", position: "all",
  product: "all", campaign: "all", adset: "all", creative: "all",
};

const ACCOUNT_KEYS = ["medsystems", "beautysystems"] as const;
const RULE_VERSION = "bitrix_rd_station_flag_v1";

export async function reconcilePaidMediaBusinessDate(businessDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const results = [] as Array<{ accountKey: typeof ACCOUNT_KEYS[number]; uniqueContacts: number; uniqueBitrixLeadIds: number; peopleWithMultipleLeadIds: number; extraLeadIds: number }>;
  const dashboards = await medsystemsBitrixRdOpportunityDashboardsByAccount({
    startDate: businessDate,
    endDate: businessDate,
    filters: DEFAULT_FILTERS,
  });

  for (const accountKey of ACCOUNT_KEYS) {
    const dashboard = dashboards[accountKey];
    const summary = JSON.stringify({
      sourceRule: dashboard.sourceRule,
      period: dashboard.period,
      duplicates: dashboard.duplicates,
      methodology: dashboard.methodology.reconciliation,
    });
    const row = {
      businessDate,
      accountKey,
      uniqueContacts: dashboard.totals.leads,
      mqlContacts: dashboard.totals.mql,
      sqlContacts: dashboard.totals.sql,
      contactsWithDeals: dashboard.totals.dealLeads,
      uniqueBitrixLeadIds: dashboard.totals.uniqueBitrixLeadIds,
      mqlLeadIds: dashboard.totals.mql,
      sqlLeadIds: dashboard.totals.sql,
      leadIdsWithDeals: dashboard.totals.dealLeads,
      reconciledByIdentity: dashboard.totals.reconciledByIdentity,
      recoveredOutsidePaidField: dashboard.totals.reconciledOutsidePaidField,
      peopleWithMultipleLeadIds: dashboard.duplicates.peopleWithMultipleLeadIds,
      leadIdsInDuplicateGroups: dashboard.duplicates.leadIdsInDuplicateGroups,
      extraLeadIds: dashboard.duplicates.extraLeadIds,
      ruleVersion: RULE_VERSION,
      status: "completed",
      summary,
      reconciledAt: new Date(),
    };
    await db.insert(paidMediaReconciliationDaily).values(row).onDuplicateKeyUpdate({ set: { ...row, updatedAt: new Date() } });
    results.push({ accountKey, uniqueContacts: row.uniqueContacts, uniqueBitrixLeadIds: row.uniqueBitrixLeadIds, peopleWithMultipleLeadIds: row.peopleWithMultipleLeadIds, extraLeadIds: row.extraLeadIds });
  }
  return { businessDate, ruleVersion: RULE_VERSION, results };
}

export function previousBusinessDayInSaoPaulo(now = new Date()) {
  const format = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const today = format(now);
  return format(new Date(new Date(`${today}T12:00:00.000Z`).getTime() - 86_400_000));
}
