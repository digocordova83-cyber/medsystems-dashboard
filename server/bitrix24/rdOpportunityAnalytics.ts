import { and, asc, eq, gt, gte, inArray, lt, sql } from "drizzle-orm";
import { bitrix24Entities, rdStationContacts, rdStationConversionEvents } from "../../drizzle/schema";
import { getDb, normalizeIdentityEmail } from "../db";
import { normalizeIdentityName } from "../leads/paidMediaEvidence";
import { qualifiesDirectApiEvent } from "../rdstation/filtering";

export const RD_STATION_FIELD = "UF_CRM_1738950899";
export const RD_STATION_VALUE = "1";
export const PAID_TRAFFIC_FIELD = "UF_CRM_1744808620";
export const PAID_TRAFFIC_VALUE = "Tráfego Pago";

const PIPELINE_LABELS: Record<string, string> = {
  "15389": "Advance",
  "15391": "Medsystems",
  "15393": "Reface",
  "15395": "BeautySystems · Negócios e Redes",
  "15397": "Canfield",
  "15399": "Aeskins",
  "15401": "Venda Recorrente - WF5",
  "17287": "Aeskins Venda Recorrente",
  "17307": "Medacademy",
  "17309": "Demonstração",
  "18811": "Franquias",
  "20889": "Não atribuído · pipeline 20889",
  "21297": "Atendimento WF4",
};

const STATUS_LABELS: Record<string, string> = {
  UC_VCB8PV: "Tentativa Assistente",
  UC_YF6XA0: "Atendimento Assistente",
  NEW: "SDR",
  UC_7SPHMW: "Retrabalho dos SDRs",
  UC_FFN3T7: "Leads de EVENTOS",
  UC_XYSVB3: "Leads URGENTES",
  IN_PROCESS: "Primeiro Contato",
  PROCESSED: "Segundo Contato",
  UC_CU60JH: "Terceiro Contato",
  UC_HZQN9I: "Relacionamento",
  "1": "Converter Lead",
  CONVERTED: "Histórico Lead Convertidos",
  JUNK: "Lead Descartado",
  UC_8AJSSF: "Lead Descartado p/ MKT",
};

export function bitrixLeadStageLabel(value: unknown) {
  const stageId = String(value ?? "").trim();
  if (!stageId) return "Etapa não informada";
  return STATUS_LABELS[stageId] ?? `Etapa #${stageId}`;
}

const RESPONSIBLE_LABELS: Record<string, string> = {
  "5521": "Vitor da Silva",
  "13877": "Marcela Assis Satilho Muller",
  "25441": "Maria Julia Pazinatto Rodrigues",
  "38111": "Eduardo Santos Franca",
  "56793": "Yasmin De Souza Freitas",
};

const MQL_STATUSES = new Set(["IN_PROCESS", "PROCESSED", "UC_CU60JH", "UC_HZQN9I", "1", "CONVERTED"]);
const SQL_STATUSES = new Set(["UC_HZQN9I", "1", "CONVERTED"]);
const LOST_STATUSES = new Set(["JUNK", "UC_8AJSSF"]);
const COMMERCIAL_CATEGORY_BY_BRAND = { medsystems: "42", beautysystems: "57" } as const;

export type RdOpportunityFilters = {
  pipeline: string;
  responsible: string;
  source: string;
  stage: string;
  position: string;
  product: string;
  campaign: string;
  adset: string;
  creative: string;
};

export type RdOpportunityRawLead = {
  bitrixId: number;
  createdAtBitrix: Date;
  stageOrStatus: string | null;
  rawPayload: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  rdAccountKey?: "medsystems" | "beautysystems";
  rdContactUuid?: string;
  rdEventDate?: Date;
  matchMethod?: "E-mail" | "Nome";
};
export type RdOpportunityRawDeal = { rawPayload: string };
export type RdOpportunityRawContact = {
  bitrixId: number;
  fullName?: string | null;
  email: string | null;
  phone: string | null;
  rawPayload: string;
};
export type RdOpportunityReferenceIdentity = {
  accountKey: "medsystems" | "beautysystems";
  identityHash: string;
  emailHash?: string | null;
  phoneHash?: string | null;
  namePhoneHash?: string | null;
  rdContactUuid: string | null;
  convertedAt?: Date | null;
};

type CountRow = { label: string; count: number };
type OptionRow = { value: string; label: string; count: number };
type BitrixMatchCandidate = {
  bitrixId: number;
  entityType: "lead" | "contact";
  fullName: string | null;
  email: string | null;
  phone: string | null;
  stageOrStatus: string | null;
  createdAtBitrix: Date;
  rawPayload: string;
};

export function resolveRdBitrixLeadMatch(input: {
  rdEmail: string | null;
  rdName: string | null;
  byEmail: Map<string, BitrixMatchCandidate[]>;
  byName: Map<string, BitrixMatchCandidate[]>;
}) {
  const email = normalizeIdentityEmail(input.rdEmail);
  const name = normalizeIdentityName(input.rdName);
  const emailCandidates = email ? input.byEmail.get(email) ?? [] : [];
  const nameCandidates = name ? input.byName.get(name) ?? [] : [];
  const candidates = emailCandidates.length ? emailCandidates : nameCandidates;
  const method: "E-mail" | "Nome" | null = emailCandidates.length ? "E-mail" : nameCandidates.length ? "Nome" : null;
  if (candidates.length === 1 && method) return { candidate: candidates[0]!, method, status: "matched" as const };
  return { candidate: null, method, status: candidates.length > 1 ? "multiple" as const : "not_found" as const };
}

export function mergePaidMediaReferenceIdentities(
  historical: RdOpportunityReferenceIdentity[],
  dynamic: RdOpportunityReferenceIdentity[],
) {
  return Array.from(new Map(
    [...historical, ...dynamic].map(reference => [`${reference.accountKey}:${reference.identityHash}`, reference]),
  ).values());
}

function cleanText(value: unknown, fallback = "Não identificado") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text || ["undefined", "null", "unknown", "n/a"].includes(text.toLowerCase())) return fallback;
  return text;
}

function cleanAttribution(value: unknown) {
  const text = cleanText(value);
  return text === "Não identificado" ? text : text.slice(0, 180);
}

function parsePayload(rawPayload: string) {
  try {
    return JSON.parse(rawPayload) as Record<string, any>;
  } catch {
    return {};
  }
}

function isRdStationLead(raw: Record<string, any>) {
  return cleanText(raw[RD_STATION_FIELD], "") === RD_STATION_VALUE;
}

function parseEmbeddedRd(raw: Record<string, any>) {
  const value = raw.UF_CRM_1778601092663;
  if (!value) return {} as Record<string, any>;
  if (typeof value === "object") return value as Record<string, any>;
  try {
    return JSON.parse(String(value)) as Record<string, any>;
  } catch {
    return {};
  }
}

function parseTrafficSource(value: unknown) {
  const text = String(value ?? "").replace(/^\?/, "");
  try {
    return Object.fromEntries(new URLSearchParams(text));
  } catch {
    return {} as Record<string, string>;
  }
}

function firstAttribution(...values: unknown[]) {
  for (const value of values) {
    const normalized = cleanAttribution(value);
    if (normalized !== "Não identificado") return normalized;
  }
  return "Não identificado";
}

function attributionFields(raw: Record<string, any>) {
  const embedded = parseEmbeddedRd(raw);
  const conversion = embedded.last_conversion ?? embedded.first_conversion ?? {};
  const origin = conversion.conversion_origin ?? {};
  const traffic = parseTrafficSource(conversion.content?.traffic_source);
  return {
    source: firstAttribution(raw.UTM_SOURCE, traffic.utm_source, origin.source),
    medium: firstAttribution(raw.UTM_MEDIUM, traffic.utm_medium, origin.medium),
    campaign: firstAttribution(raw.UTM_CAMPAIGN, traffic.utm_campaign, origin.campaign),
    adset: firstAttribution(raw.UTM_CONTENT, traffic.utm_content),
    creative: firstAttribution(raw.UTM_TERM, traffic.utm_term),
    sourceDescription: cleanAttribution(raw.SOURCE_DESCRIPTION),
  };
}

function commercialAttributionFields(raw: Record<string, any>) {
  const genericValues = new Set(["app", "(not set)", "not set", "n/a", "na"]);
  const normalize = (value: string) => genericValues.has(value.toLowerCase()) ? "Não identificado" : value;
  const fields = attributionFields(raw);
  return {
    source: normalize(fields.source),
    medium: normalize(fields.medium),
    campaign: normalize(fields.campaign),
    adset: normalize(fields.adset),
    creative: normalize(fields.creative),
  };
}

function addCount(map: Map<string, number>, label: string, amount = 1) {
  map.set(label, (map.get(label) ?? 0) + amount);
}

function countRows(map: Map<string, number>): CountRow[] {
  return Array.from(map, ([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function optionRows(map: Map<string, { label: string; identities: Set<string> }>): OptionRow[] {
  return Array.from(map, ([value, item]) => ({ value, label: item.label, count: item.identities.size }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function dayKey(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function periodDayKeys(period: { start: string; end: string }) {
  const days: string[] = [];
  const cursor = new Date(`${period.start}T12:00:00-03:00`);
  const end = new Date(`${period.end}T12:00:00-03:00`);
  while (cursor <= end) {
    days.push(dayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rate(value: number, total: number) {
  return total ? (value / total) * 100 : 0;
}

export function validateBusinessDateRange(startDate: string, endDate: string) {
  const valid = /^\d{4}-\d{2}-\d{2}$/;
  if (!valid.test(startDate) || !valid.test(endDate)) throw new Error("Informe as datas no formato AAAA-MM-DD.");
  if (startDate > endDate) throw new Error("A data inicial não pode ser posterior à data final.");
  const start = new Date(`${startDate}T00:00:00-03:00`);
  const endExclusive = new Date(`${endDate}T00:00:00-03:00`);
  endExclusive.setDate(endExclusive.getDate() + 1);
  return { start, endExclusive };
}

export function rdOpportunityCandidateRows(input: {
  rows: RdOpportunityRawLead[];
  dealRows?: RdOpportunityRawDeal[];
  contactRows?: RdOpportunityRawContact[];
  referenceRows?: RdOpportunityReferenceIdentity[];
  identitySecret?: string;
}) {
  return input.rows.filter(row => isRdStationLead(parsePayload(row.rawPayload)));
}

export function buildRdOpportunityManagerDashboard(input: {
  rows: RdOpportunityRawLead[];
  dealRows?: RdOpportunityRawDeal[];
  contactRows?: RdOpportunityRawContact[];
  referenceRows?: RdOpportunityReferenceIdentity[];
  identitySecret?: string;
  bitrixPeriod?: { start: Date; end: Date };
  filters: RdOpportunityFilters;
  period: { start: string; end: string };
}) {
  const optionMaps = {
    pipelines: new Map<string, { label: string; identities: Set<string> }>(),
    responsibles: new Map<string, { label: string; identities: Set<string> }>(),
    sources: new Map<string, { label: string; identities: Set<string> }>(),
    stages: new Map<string, { label: string; identities: Set<string> }>(),
    positions: new Map<string, { label: string; identities: Set<string> }>(),
    products: new Map<string, { label: string; identities: Set<string> }>(),
    campaigns: new Map<string, { label: string; identities: Set<string> }>(),
    adsets: new Map<string, { label: string; identities: Set<string> }>(),
    creatives: new Map<string, { label: string; identities: Set<string> }>(),
  };

  const base = input.rows.flatMap(row => {
    const raw = parsePayload(row.rawPayload);
    if (!row.rdAccountKey && !isRdStationLead(raw)) return [];
    const pipelineId = cleanText(raw.UF_CRM_1739195085, "unknown");
    const responsibleId = cleanText(raw.ASSIGNED_BY_ID, "unknown");
    const stageId = cleanText(raw.STATUS_ID ?? row.stageOrStatus, "unknown");
    const fields = attributionFields(raw);
    const identityKey = row.rdAccountKey && row.rdContactUuid ? `rd:${row.rdAccountKey}:${row.rdContactUuid}` : `lead:${row.bitrixId}`;
    const item = {
      row,
      raw,
      pipelineId,
      pipelineLabel: PIPELINE_LABELS[pipelineId] ?? (pipelineId === "unknown" ? "Não identificado" : `Pipeline #${pipelineId}`),
      responsibleId,
      responsibleLabel: RESPONSIBLE_LABELS[responsibleId] ?? (responsibleId === "unknown" ? "Não identificado" : `Responsável #${responsibleId}`),
      stageId,
      stageLabel: STATUS_LABELS[stageId] ?? (stageId === "unknown" ? "Não identificado" : `Etapa #${stageId}`),
      positionLabel: cleanText(raw.POST),
      productLabel: cleanText(raw.UF_CRM_1738950946),
      identityKey,
      ...fields,
    };

    for (const [map, value, label] of [
      [optionMaps.pipelines, item.pipelineId, item.pipelineLabel],
      [optionMaps.responsibles, item.responsibleId, item.responsibleLabel],
      [optionMaps.sources, item.source, item.source],
      [optionMaps.stages, item.stageId, item.stageLabel],
      [optionMaps.positions, item.positionLabel, item.positionLabel],
      [optionMaps.products, item.productLabel, item.productLabel],
      [optionMaps.campaigns, item.campaign, item.campaign],
      [optionMaps.adsets, item.adset, item.adset],
      [optionMaps.creatives, item.creative, item.creative],
    ] as const) {
      const current = map.get(value) ?? { label, identities: new Set<string>() };
      current.identities.add(identityKey);
      map.set(value, current);
    }
    return [item];
  });

  const eligible = base.filter(item =>
    (input.filters.pipeline === "all" || item.pipelineId === input.filters.pipeline)
    && (input.filters.responsible === "all" || item.responsibleId === input.filters.responsible)
    && (input.filters.source === "all" || item.source === input.filters.source)
    && (input.filters.stage === "all" || item.stageId === input.filters.stage)
    && (input.filters.position === "all" || item.positionLabel === input.filters.position)
    && (input.filters.product === "all" || item.productLabel === input.filters.product)
    && (input.filters.campaign === "all" || item.campaign === input.filters.campaign)
    && (input.filters.adset === "all" || item.adset === input.filters.adset)
    && (input.filters.creative === "all" || item.creative === input.filters.creative)
  );

  const distributions = {
    responsible: new Map<string, number>(),
    source: new Map<string, number>(),
    stages: new Map<string, number>(),
    positions: new Map<string, number>(),
    products: new Map<string, number>(),
    campaigns: new Map<string, number>(),
  };
  const daily = new Map<string, { leads: number; mql: number; sql: number; deals: number }>();
  const coverage = { source: 0, medium: 0, campaign: 0, adset: 0, creative: 0, responsible: 0, linkedDeal: 0 };
  const attribution = new Map<string, {
    source: string;
    medium: string;
    campaign: string;
    adset: string;
    creative: string;
    leads: number;
    mql: number;
    sql: number;
    deals: number;
    wonDeals: number;
    dealValue: number;
    wonValue: number;
  }>();
  let mql = 0;
  let sqlCount = 0;

  for (const item of eligible) {
    const isMql = MQL_STATUSES.has(item.stageId);
    const isSql = SQL_STATUSES.has(item.stageId);
    if (isMql) mql += 1;
    if (isSql) sqlCount += 1;
    const day = dayKey(item.row.rdEventDate ?? item.row.createdAtBitrix);
    const dayItem = daily.get(day) ?? { leads: 0, mql: 0, sql: 0, deals: 0 };
    dayItem.leads += 1;
    dayItem.mql += isMql ? 1 : 0;
    dayItem.sql += isSql ? 1 : 0;
    daily.set(day, dayItem);
    addCount(distributions.responsible, item.responsibleLabel);
    addCount(distributions.source, item.source);
    addCount(distributions.stages, item.stageLabel);
    addCount(distributions.positions, item.positionLabel);
    addCount(distributions.products, item.productLabel);
    addCount(distributions.campaigns, item.campaign);
    if (item.source !== "Não identificado") coverage.source += 1;
    if (item.medium !== "Não identificado") coverage.medium += 1;
    if (item.campaign !== "Não identificado") coverage.campaign += 1;
    if (item.adset !== "Não identificado") coverage.adset += 1;
    if (item.creative !== "Não identificado") coverage.creative += 1;
    if (item.responsibleId !== "unknown") coverage.responsible += 1;
    const key = [item.source, item.medium, item.campaign, item.adset, item.creative].join("\u0001");
    const attr = attribution.get(key) ?? {
      source: item.source,
      medium: item.medium,
      campaign: item.campaign,
      adset: item.adset,
      creative: item.creative,
      leads: 0,
      mql: 0,
      sql: 0,
      deals: 0,
      wonDeals: 0,
      dealValue: 0,
      wonValue: 0,
    };
    attr.leads += 1;
    attr.mql += isMql ? 1 : 0;
    attr.sql += isSql ? 1 : 0;
    attribution.set(key, attr);
  }

  const uniqueWonDeals = Array.from(new Map((input.dealRows ?? []).map((row, index) => {
    const deal = parsePayload(row.rawPayload);
    return [cleanText(deal.ID, `sem-id-${index}`), deal] as const;
  })).values()).filter(deal => cleanText(deal.STAGE_SEMANTIC_ID, "") === "S");
  const requestedCategory = input.filters.pipeline === "15391"
    ? COMMERCIAL_CATEGORY_BY_BRAND.medsystems
    : input.filters.pipeline === "15395"
      ? COMMERCIAL_CATEGORY_BY_BRAND.beautysystems
      : input.filters.pipeline === "all"
        ? null
        : "none";
  const commercialWins = uniqueWonDeals.filter(deal => {
    const categoryId = cleanText(deal.CATEGORY_ID, "");
    return requestedCategory === null
      ? Object.values(COMMERCIAL_CATEGORY_BY_BRAND).includes(categoryId as "42" | "57")
      : categoryId === requestedCategory;
  });
  const winsByBu = {
    medsystems: { count: 0, value: 0 },
    beautysystems: { count: 0, value: 0 },
  };
  for (const deal of commercialWins) {
    const categoryId = cleanText(deal.CATEGORY_ID, "");
    const brand = categoryId === COMMERCIAL_CATEGORY_BY_BRAND.medsystems ? "medsystems" : categoryId === COMMERCIAL_CATEGORY_BY_BRAND.beautysystems ? "beautysystems" : null;
    if (!brand) continue;
    winsByBu[brand].count += 1;
    winsByBu[brand].value += numberValue(deal.OPPORTUNITY);
  }
  const wonDeals = commercialWins.length;
  const wonValue = commercialWins.reduce((sum, deal) => sum + numberValue(deal.OPPORTUNITY), 0);
  const winsAttribution = new Map<string, {
    source: string;
    medium: string;
    campaign: string;
    adset: string;
    creative: string;
    wonDeals: number;
    wonValue: number;
  }>();
  const winsAttributionCoverage = { source: 0, medium: 0, campaign: 0, adset: 0, creative: 0, total: commercialWins.length };
  for (const deal of commercialWins) {
    const fields = commercialAttributionFields(deal);
    if (fields.source !== "Não identificado") winsAttributionCoverage.source += 1;
    if (fields.medium !== "Não identificado") winsAttributionCoverage.medium += 1;
    if (fields.campaign !== "Não identificado") winsAttributionCoverage.campaign += 1;
    if (fields.adset !== "Não identificado") winsAttributionCoverage.adset += 1;
    if (fields.creative !== "Não identificado") winsAttributionCoverage.creative += 1;
    const key = [fields.source, fields.medium, fields.campaign, fields.adset, fields.creative].join("\u0001");
    const row = winsAttribution.get(key) ?? { ...fields, wonDeals: 0, wonValue: 0 };
    row.wonDeals += 1;
    row.wonValue += numberValue(deal.OPPORTUNITY);
    winsAttribution.set(key, row);
  }
  const leads = eligible.length;
  const unassignedLeads = eligible.filter(item => !["15391", "15395"].includes(item.pipelineId)).length;

  return {
    sourceRule: "Contato RD Station qualificado e localizado de forma única no Bitrix24 por e-mail ou nome; uma linha por contato RD encontrado",
    period: input.period,
    selectedFilters: input.filters,
    filterOptions: Object.fromEntries(Object.entries(optionMaps).map(([key, map]) => [key, optionRows(map)])),
    totals: {
      leads,
      uniqueContacts: leads,
      uniqueBitrixLeadIds: leads,
      mql,
      sql: sqlCount,
      dealLeads: 0,
      wonLeadCount: 0,
      dealCount: wonDeals,
      wonDeals,
      openDeals: 0,
      lostDeals: 0,
      totalDealValue: wonValue,
      wonValue,
      discardedLeads: eligible.filter(item => LOST_STATUSES.has(item.stageId)).length,
      unassignedLeads,
      reconciledByIdentity: 0,
      reconciledOutsidePaidField: 0,
    },
    commercialWinsByBu: winsByBu,
    winsAttribution: Array.from(winsAttribution.values()).sort((a, b) => b.wonDeals - a.wonDeals || b.wonValue - a.wonValue || a.campaign.localeCompare(b.campaign)),
    winsAttributionCoverage,
    funnel: [
      { key: "lead", label: "Leads encontrados", count: leads, conversionFromPrevious: 100, conversionFromLead: 100, rule: "Contato RD Station qualificado no período com correspondência única por e-mail ou nome na base do Bitrix24" },
      { key: "mql", label: "MQL · Qualificados", count: mql, conversionFromPrevious: rate(mql, leads), conversionFromLead: rate(mql, leads), rule: "Primeiro Contato ou etapa posterior no status atual do lead" },
      { key: "sql", label: "SQL · Oportunidades", count: sqlCount, conversionFromPrevious: rate(sqlCount, mql), conversionFromLead: rate(sqlCount, leads), rule: "Relacionamento, Converter Lead ou Histórico Lead Convertidos" },
    ],
    coverage,
    byDay: periodDayKeys(input.period).map(date => ({ date, ...(daily.get(date) ?? { leads: 0, mql: 0, sql: 0, deals: 0 }) })),
    stages: countRows(distributions.stages),
    responsible: countRows(distributions.responsible),
    sourceInformation: countRows(distributions.source),
    positions: countRows(distributions.positions),
    products: countRows(distributions.products),
    campaigns: countRows(distributions.campaigns),
    duplicates: {
      peopleWithMultipleLeadIds: 0,
      leadIdsInDuplicateGroups: 0,
      extraLeadIds: 0,
      byBrand: [],
      byCampaign: [],
      byMatchMethod: [],
    },
    attribution: Array.from(attribution.values()).sort((a, b) => b.leads - a.leads || a.campaign.localeCompare(b.campaign)),
    methodology: {
      mql: "Etapa atual em Primeiro Contato, Segundo Contato, Terceiro Contato, Relacionamento, Converter Lead ou Histórico Lead Convertidos.",
      sql: "Etapa atual em Relacionamento, Converter Lead ou Histórico Lead Convertidos.",
      deal: "Negócios ganhos são lidos separadamente nos pipelines comerciais oficiais pelo fechamento no período. Campanha, conjunto e criativo de ganhos usam apenas UTMs presentes diretamente no negócio; ausências ficam como Não identificado.",
      attribution: "UTMs diretas do lead; fallback para o payload RD Station embutido. UTM content representa conjunto/grupo e UTM term representa criativo; ausências aparecem como Não identificado.",
      reconciliation: "O universo inclui somente contatos qualificados do RD Station no período que possuem uma correspondência única no Bitrix24 por e-mail exato ou, na ausência de e-mail correspondente, nome normalizado. Registros ambíguos ou não encontrados permanecem fora do funil e visíveis na auditoria. A BU vem somente do Pipeline de Vendas; registros sem pipeline reconhecido permanecem como não atribuídos.",
      limitation: "MQL e SQL representam o status atual do lead, não o histórico de passagem entre etapas. Negócios ganhos são uma leitura comercial independente e não compõem taxa de conversão do funil sem vínculo técnico confiável.",
    },
  };
}

type RdOpportunityDataset = {
  rows: RdOpportunityRawLead[];
  dealRows: RdOpportunityRawDeal[];
};

const PAGE_SIZE = 250;

async function loadRdOpportunityDataset(input: {
  portal: string;
  start: Date;
  end: Date;
  startDate: string;
  endDate: string;
}): Promise<RdOpportunityDataset> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [rdEvents, rdContacts, bitrixLeads, bitrixContacts] = await Promise.all([
    db.select({ accountKey: rdStationConversionEvents.accountKey, contactUuid: rdStationConversionEvents.contactUuid, eventCreatedAt: rdStationConversionEvents.eventCreatedAt, rawPayload: rdStationConversionEvents.rawPayload })
      .from(rdStationConversionEvents)
      .where(and(inArray(rdStationConversionEvents.accountKey, ["medsystems", "beautysystems"]), gte(rdStationConversionEvents.eventCreatedAt, input.start), lt(rdStationConversionEvents.eventCreatedAt, input.end))),
    db.select({ accountKey: rdStationContacts.accountKey, contactUuid: rdStationContacts.contactUuid, name: rdStationContacts.name, email: rdStationContacts.email, phone: rdStationContacts.phone })
      .from(rdStationContacts)
      .where(inArray(rdStationContacts.accountKey, ["medsystems", "beautysystems"])),
    db.select({ bitrixId: bitrix24Entities.bitrixId, fullName: bitrix24Entities.fullName, email: bitrix24Entities.email, phone: bitrix24Entities.phone, stageOrStatus: bitrix24Entities.stageOrStatus, createdAtBitrix: bitrix24Entities.createdAtBitrix, rawPayload: bitrix24Entities.rawPayload })
      .from(bitrix24Entities)
      .where(and(eq(bitrix24Entities.portal, input.portal), eq(bitrix24Entities.entityType, "lead"))),
    db.select({ bitrixId: bitrix24Entities.bitrixId, fullName: bitrix24Entities.fullName, email: bitrix24Entities.email, phone: bitrix24Entities.phone, stageOrStatus: bitrix24Entities.stageOrStatus, createdAtBitrix: bitrix24Entities.createdAtBitrix, rawPayload: bitrix24Entities.rawPayload })
      .from(bitrix24Entities)
      .where(and(eq(bitrix24Entities.portal, input.portal), eq(bitrix24Entities.entityType, "contact"))),
  ]);
  const contactsByKey = new Map(rdContacts.map(contact => [`${contact.accountKey}:${contact.contactUuid}`, contact]));
  const qualified = new Map<string, { accountKey: "medsystems" | "beautysystems"; contactUuid: string; eventCreatedAt: Date }>();
  for (const event of rdEvents) {
    if (!qualifiesDirectApiEvent(parsePayload(event.rawPayload)).qualifies) continue;
    const key = `${event.accountKey}:${event.contactUuid}`;
    const existing = qualified.get(key);
    if (!existing || event.eventCreatedAt < existing.eventCreatedAt) qualified.set(key, { accountKey: event.accountKey, contactUuid: event.contactUuid, eventCreatedAt: event.eventCreatedAt });
  }
  const contactsById = new Map(bitrixContacts.map(contact => [contact.bitrixId, contact]));
  const linkedContactIds = new Set<number>();
  const candidates: BitrixMatchCandidate[] = bitrixLeads.map(lead => {
    const linkedContactId = Number(parsePayload(lead.rawPayload).CONTACT_ID);
    const linkedContact = contactsById.get(linkedContactId);
    if (linkedContact) linkedContactIds.add(linkedContactId);
    return {
      ...lead,
      entityType: "lead" as const,
      fullName: normalizeIdentityName(lead.fullName) ? lead.fullName : linkedContact?.fullName ?? null,
      email: normalizeIdentityEmail(lead.email) ? lead.email : linkedContact?.email ?? null,
      phone: lead.phone ?? linkedContact?.phone ?? null,
    };
  });
  for (const contact of bitrixContacts) {
    if (linkedContactIds.has(contact.bitrixId)) continue;
    candidates.push({ ...contact, entityType: "contact" });
  }
  const byEmail = new Map<string, BitrixMatchCandidate[]>();
  const byName = new Map<string, BitrixMatchCandidate[]>();
  for (const candidate of candidates) {
    const add = (index: Map<string, BitrixMatchCandidate[]>, key: string | null) => {
      if (!key) return;
      const current = index.get(key) ?? [];
      if (!current.some(item => item.entityType === candidate.entityType && item.bitrixId === candidate.bitrixId)) current.push(candidate);
      index.set(key, current);
    };
    add(byEmail, normalizeIdentityEmail(candidate.email));
    add(byName, normalizeIdentityName(candidate.fullName));
  }
  const rows: RdOpportunityRawLead[] = [];
  for (const item of Array.from(qualified.values())) {
    const contact = contactsByKey.get(`${item.accountKey}:${item.contactUuid}`);
    if (!contact) continue;
    const match = resolveRdBitrixLeadMatch({ rdEmail: contact.email, rdName: contact.name, byEmail, byName });
    if (match.status !== "matched" || !match.candidate) continue;
    rows.push({
      bitrixId: match.candidate.bitrixId,
      createdAtBitrix: match.candidate.createdAtBitrix,
      stageOrStatus: match.candidate.stageOrStatus,
      rawPayload: match.candidate.rawPayload,
      fullName: match.candidate.fullName,
      email: match.candidate.email,
      phone: match.candidate.phone,
      rdAccountKey: item.accountKey,
      rdContactUuid: item.contactUuid,
      rdEventDate: item.eventCreatedAt,
      matchMethod: match.method,
    });
  }

  const categoryId = sql<string>`json_unquote(json_extract(${bitrix24Entities.rawPayload}, '$.CATEGORY_ID'))`;
  const semanticId = sql<string>`json_unquote(json_extract(${bitrix24Entities.rawPayload}, '$.STAGE_SEMANTIC_ID'))`;
  const wonRows = await db.select({ rawPayload: bitrix24Entities.rawPayload }).from(bitrix24Entities).where(and(
    eq(bitrix24Entities.portal, input.portal),
    eq(bitrix24Entities.entityType, "deal"),
    eq(semanticId, "S"),
    inArray(categoryId, Object.values(COMMERCIAL_CATEGORY_BY_BRAND)),
  ));
  const dealRows = wonRows.filter(row => {
    const closeDay = cleanText(parsePayload(row.rawPayload).CLOSEDATE, "").slice(0, 10);
    return closeDay >= input.startDate && closeDay <= input.endDate;
  });
  return { rows, dealRows };
}

export async function rdOpportunityManagerDashboard(input: {
  portal: string;
  start: Date;
  end: Date;
  startDate: string;
  endDate: string;
  filters: RdOpportunityFilters;
}) {
  const dataset = await loadRdOpportunityDataset(input);
  return buildRdOpportunityManagerDashboard({ ...dataset, filters: input.filters, period: { start: input.startDate, end: input.endDate } });
}

export async function rdOpportunityManagerDashboardsByAccount(input: {
  portal: string;
  start: Date;
  end: Date;
  startDate: string;
  endDate: string;
  filters: RdOpportunityFilters;
}) {
  const dataset = await loadRdOpportunityDataset(input);
  return {
    medsystems: buildRdOpportunityManagerDashboard({ ...dataset, filters: { ...input.filters, pipeline: "15391" }, period: { start: input.startDate, end: input.endDate } }),
    beautysystems: buildRdOpportunityManagerDashboard({ ...dataset, filters: { ...input.filters, pipeline: "15395" }, period: { start: input.startDate, end: input.endDate } }),
  };
}
