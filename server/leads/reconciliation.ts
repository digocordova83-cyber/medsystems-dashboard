import { and, eq, gte, lt, lte } from "drizzle-orm";
import { leadReferenceBenchmarks, leadReferenceEvents } from "../../drizzle/schema";
import { getDb } from "../db";

export type LeadReferenceBrand = "medsystems" | "beautysystems";
export type LeadReferenceChannel = "meta_ads" | "google_ads" | "unknown";
export type LeadReferenceFilters = {
  startDate: string;
  endDate: string;
  brand: "all" | LeadReferenceBrand;
  channel: "all" | LeadReferenceChannel;
};

type ReferenceEvent = {
  accountKey: LeadReferenceBrand;
  convertedAt: Date;
  identityHash: string;
  channel: LeadReferenceChannel;
  utmSource: string | null;
  utmCampaign: string | null;
  conversionEvent: string | null;
  rdContactUuid: string | null;
};

type Benchmark = {
  businessDate: string;
  accountKey: LeadReferenceBrand;
  sourceLabel: string;
  reportedLeads: number;
  note: string | null;
};

const BRAND_LABEL: Record<LeadReferenceBrand, string> = {
  medsystems: "MedSystems",
  beautysystems: "BeautySystems",
};

function businessDate(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function safeLabel(value: string | null, fallback: string) {
  return value?.trim() || fallback;
}

function ranked<T extends { count: number; label: string }>(rows: T[]) {
  return rows.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function buildLeadReconciliation(events: ReferenceEvent[], benchmarks: Benchmark[]) {
  const identities = new Set<string>();
  const rdIdentities = new Set<string>();
  const byBrand = new Map<LeadReferenceBrand, { sourceVolume: number; identities: Set<string>; rdIdentities: Set<string>; identifiedSource: number; unknownSource: number }>();
  const channels = new Map<LeadReferenceChannel, number>();
  const days = new Map<string, { total: number; medsystems: number; beautysystems: number }>();
  const campaigns = new Map<string, { label: string; brand: LeadReferenceBrand; channel: LeadReferenceChannel; count: number; identities: Set<string> }>();
  const conversionEvents = new Map<string, { label: string; brand: LeadReferenceBrand; count: number }>();

  for (const event of events) {
    identities.add(`${event.accountKey}:${event.identityHash}`);
    if (event.rdContactUuid) rdIdentities.add(`${event.accountKey}:${event.identityHash}`);
    const brand = byBrand.get(event.accountKey) ?? { sourceVolume: 0, identities: new Set<string>(), rdIdentities: new Set<string>(), identifiedSource: 0, unknownSource: 0 };
    byBrand.set(event.accountKey, brand);
    brand.sourceVolume += 1;
    brand.identities.add(event.identityHash);
    if (event.rdContactUuid) brand.rdIdentities.add(event.identityHash);
    if (event.channel === "unknown") brand.unknownSource += 1;
    else brand.identifiedSource += 1;
    channels.set(event.channel, (channels.get(event.channel) ?? 0) + 1);

    const day = businessDate(event.convertedAt);
    const dayRow = days.get(day) ?? { total: 0, medsystems: 0, beautysystems: 0 };
    dayRow.total += 1;
    dayRow[event.accountKey] += 1;
    days.set(day, dayRow);

    const campaign = safeLabel(event.utmCampaign, "Campanha não identificada");
    const campaignKey = `${event.accountKey}:${event.channel}:${campaign}`;
    const campaignRow = campaigns.get(campaignKey) ?? { label: campaign, brand: event.accountKey, channel: event.channel, count: 0, identities: new Set<string>() };
    campaignRow.count += 1;
    campaignRow.identities.add(event.identityHash);
    campaigns.set(campaignKey, campaignRow);

    const conversion = safeLabel(event.conversionEvent, "Evento não identificado");
    const conversionKey = `${event.accountKey}:${conversion}`;
    const conversionRow = conversionEvents.get(conversionKey) ?? { label: conversion, brand: event.accountKey, count: 0 };
    conversionRow.count += 1;
    conversionEvents.set(conversionKey, conversionRow);
  }

  const benchmarkByBrand = new Map<LeadReferenceBrand, Benchmark[]>();
  for (const benchmark of benchmarks) benchmarkByBrand.set(benchmark.accountKey, [...(benchmarkByBrand.get(benchmark.accountKey) ?? []), benchmark]);
  const brandRows = (["medsystems", "beautysystems"] as const).map(accountKey => {
    const metrics = byBrand.get(accountKey) ?? { sourceVolume: 0, identities: new Set<string>(), rdIdentities: new Set<string>(), identifiedSource: 0, unknownSource: 0 };
    const brandBenchmarks = benchmarkByBrand.get(accountKey) ?? [];
    const reported = brandBenchmarks.reduce((sum, item) => sum + item.reportedLeads, 0);
    return {
      accountKey,
      label: BRAND_LABEL[accountKey],
      sourceVolume: metrics.sourceVolume,
      uniqueContacts: metrics.identities.size,
      rdMatchedContacts: metrics.rdIdentities.size,
      identifiedSource: metrics.identifiedSource,
      unknownSource: metrics.unknownSource,
      managerReported: brandBenchmarks.length ? reported : null,
      differenceToManager: brandBenchmarks.length ? metrics.sourceVolume - reported : null,
      benchmarkNotes: brandBenchmarks.map(item => ({ date: item.businessDate, source: item.sourceLabel, reportedLeads: item.reportedLeads, note: item.note })),
    };
  });

  return {
    totals: {
      sourceVolume: events.length,
      uniqueContacts: identities.size,
      rdMatchedContacts: rdIdentities.size,
      identifiedSource: events.filter(event => event.channel !== "unknown").length,
      unknownSource: events.filter(event => event.channel === "unknown").length,
      managerReported: benchmarks.length ? benchmarks.reduce((sum, item) => sum + item.reportedLeads, 0) : null,
    },
    byBrand: brandRows,
    byChannel: (["meta_ads", "google_ads", "unknown"] as const).map(channel => ({ channel, count: channels.get(channel) ?? 0 })),
    byDay: Array.from(days.entries()).map(([date, values]) => ({ date, ...values })).sort((a, b) => a.date.localeCompare(b.date)),
    campaigns: ranked(Array.from(campaigns.values()).map(row => ({ label: row.label, brand: row.brand, channel: row.channel, count: row.count, uniqueContacts: row.identities.size }))).slice(0, 25),
    conversionEvents: ranked(Array.from(conversionEvents.values()).map(row => ({ ...row }))).slice(0, 25),
    coverage: events.length ? {
      rdMatchRate: rdIdentities.size / identities.size,
      identifiedSourceRate: events.filter(event => event.channel !== "unknown").length / events.length,
    } : { rdMatchRate: 0, identifiedSourceRate: 0 },
    methodology: {
      timezone: "America/Sao_Paulo",
      brandSource: "client_slug da fonte de referência",
      eventUniqueness: "sourceRecordHash derivado de BU, identidade, timestamp, UTM, campanha e evento",
      personUniqueness: "BU + hash de e-mail ou telefone normalizado",
      unknownTreatment: "Origem desconhecida permanece separada e não é atribuída à mídia paga",
    },
  };
}

export async function leadReconciliationDashboard(filters: LeadReferenceFilters) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const start = new Date(`${filters.startDate}T00:00:00-03:00`);
  const end = new Date(`${filters.endDate}T00:00:00-03:00`);
  end.setUTCDate(end.getUTCDate() + 1);
  const conditions = [gte(leadReferenceEvents.convertedAt, start), lt(leadReferenceEvents.convertedAt, end)];
  if (filters.brand !== "all") conditions.push(eq(leadReferenceEvents.accountKey, filters.brand));
  if (filters.channel !== "all") conditions.push(eq(leadReferenceEvents.channel, filters.channel));
  const events = await db.select({
    accountKey: leadReferenceEvents.accountKey,
    convertedAt: leadReferenceEvents.convertedAt,
    identityHash: leadReferenceEvents.identityHash,
    channel: leadReferenceEvents.channel,
    utmSource: leadReferenceEvents.utmSource,
    utmCampaign: leadReferenceEvents.utmCampaign,
    conversionEvent: leadReferenceEvents.conversionEvent,
    rdContactUuid: leadReferenceEvents.rdContactUuid,
  }).from(leadReferenceEvents).where(and(...conditions));
  const benchmarkConditions = [gte(leadReferenceBenchmarks.businessDate, filters.startDate), lte(leadReferenceBenchmarks.businessDate, filters.endDate)];
  if (filters.brand !== "all") benchmarkConditions.push(eq(leadReferenceBenchmarks.accountKey, filters.brand));
  const benchmarks = filters.channel === "all" ? await db.select({
    businessDate: leadReferenceBenchmarks.businessDate,
    accountKey: leadReferenceBenchmarks.accountKey,
    sourceLabel: leadReferenceBenchmarks.sourceLabel,
    reportedLeads: leadReferenceBenchmarks.reportedLeads,
    note: leadReferenceBenchmarks.note,
  }).from(leadReferenceBenchmarks).where(and(...benchmarkConditions)) : [];
  return { filters, ...buildLeadReconciliation(events, benchmarks) };
}
