import { createHmac } from "node:crypto";
import { and, asc, eq, gt, gte, inArray, lt, sql } from "drizzle-orm";
import { bitrix24Entities, leadReferenceEvents, rdStationContacts, rdStationConversionEvents } from "../../drizzle/schema";
import { getDb, normalizeIdentityEmail, normalizeIdentityPhone } from "../db";
import { buildPaidMediaReferenceIdentities, normalizeIdentityName } from "../leads/paidMediaEvidence";

export const PAID_TRAFFIC_FIELD = "UF_CRM_1744808620";
export const PAID_TRAFFIC_VALUE = "Tráfego Pago";

const PIPELINE_LABELS: Record<string, string> = {
  "15389": "Advance", "15391": "Medsystems", "15393": "Reface", "15395": "BeautySystems · Negócios e Redes", "15397": "Canfield", "15399": "Aeskins",
  "15401": "Venda Recorrente - WF5", "17287": "Aeskins Venda Recorrente", "17307": "Medacademy", "17309": "Demonstração", "18811": "Franquias",
  "20889": "Consumíveis", "21297": "Atendimento WF4",
};

const STATUS_LABELS: Record<string, string> = {
  UC_VCB8PV: "Tentativa Assistente", UC_YF6XA0: "Atendimento Assistente", NEW: "SDR", UC_7SPHMW: "Retrabalho dos SDRs", UC_FFN3T7: "Leads de EVENTOS",
  UC_XYSVB3: "Leads URGENTES", IN_PROCESS: "Primeiro Contato", PROCESSED: "Segundo Contato", UC_CU60JH: "Terceiro Contato", UC_HZQN9I: "Relacionamento",
  "1": "Converter Lead", CONVERTED: "Histórico Lead Convertidos", JUNK: "Lead Descartado", UC_8AJSSF: "Lead Descartado p/ MKT",
};

const RESPONSIBLE_LABELS: Record<string, string> = {
  "5521": "Vitor da Silva", "13877": "Marcela Assis Satilho Muller", "25441": "Maria Julia Pazinatto Rodrigues", "38111": "Eduardo Santos Franca", "56793": "Yasmin De Souza Freitas",
};

const MQL_STATUSES = new Set(["IN_PROCESS", "PROCESSED", "UC_CU60JH", "UC_HZQN9I", "1", "CONVERTED"]);
const SQL_STATUSES = new Set(["UC_HZQN9I", "1", "CONVERTED"]);
const LOST_STATUSES = new Set(["JUNK", "UC_8AJSSF"]);

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

export type RdOpportunityRawLead = { bitrixId: number; createdAtBitrix: Date; stageOrStatus: string | null; rawPayload: string; fullName?: string | null; email?: string | null; phone?: string | null };
export type RdOpportunityRawDeal = { rawPayload: string };
export type RdOpportunityRawContact = { bitrixId: number; fullName?: string | null; email: string | null; phone: string | null; rawPayload: string };
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
  try { return JSON.parse(rawPayload) as Record<string, any>; } catch { return {}; }
}

function parseEmbeddedRd(raw: Record<string, any>) {
  const value = raw.UF_CRM_1778601092663;
  if (!value) return {} as Record<string, any>;
  if (typeof value === "object") return value as Record<string, any>;
  try { return JSON.parse(String(value)) as Record<string, any>; } catch { return {}; }
}

function parseTrafficSource(value: unknown) {
  const text = String(value ?? "").replace(/^\?/, "");
  try { return Object.fromEntries(new URLSearchParams(text)); } catch { return {} as Record<string, string>; }
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
  const source = firstAttribution(raw.UTM_SOURCE, traffic.utm_source, origin.source);
  const medium = firstAttribution(raw.UTM_MEDIUM, traffic.utm_medium, origin.medium);
  const campaign = firstAttribution(raw.UTM_CAMPAIGN, traffic.utm_campaign, origin.campaign);
  const adset = firstAttribution(raw.UTM_CONTENT, traffic.utm_content);
  const creative = firstAttribution(raw.UTM_TERM, traffic.utm_term);
  const sourceDescription = cleanAttribution(raw.SOURCE_DESCRIPTION);
  return { source, medium, campaign, adset, creative, sourceDescription };
}

function addCount(map: Map<string, number>, label: string, amount = 1) { map.set(label, (map.get(label) ?? 0) + amount); }
function countRows(map: Map<string, number>): CountRow[] { return Array.from(map, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)); }
function optionRows(map: Map<string, { label: string; identities: Set<string> }>): OptionRow[] { return Array.from(map, ([value, item]) => ({ value, label: item.label, count: item.identities.size })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)); }
function dayKey(date: Date) { return date.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }); }
function numberValue(value: unknown) { const parsed = Number(value ?? 0); return Number.isFinite(parsed) ? parsed : 0; }
function rate(value: number, total: number) { return total ? (value / total) * 100 : 0; }

const RECONCILED_PIPELINE_BY_BRAND = { medsystems: "15391", beautysystems: "15395" } as const;
type ReconciledBrand = keyof typeof RECONCILED_PIPELINE_BY_BRAND;

function multiValues(value: unknown) {
  if (Array.isArray(value)) return value.flatMap(item => typeof item === "object" && item ? [String((item as any).VALUE ?? "")] : [String(item ?? "")]).filter(Boolean);
  return value == null ? [] : [String(value)];
}

function digestIdentity(secret: string, value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function referenceMatchesForLead(input: {
  row: RdOpportunityRawLead;
  raw: Record<string, any>;
  linkedContacts?: RdOpportunityRawContact[];
  references: RdOpportunityReferenceIdentity[];
  identitySecret: string;
  originalBrand: ReconciledBrand | null;
}) {
  if (!input.references.length) return [] as { brand: ReconciledBrand; identityKey: string; method: "rd_uuid" | "email" | "name_phone" | "phone"; convertedAt: Date | null }[];
  const uniqueMatches = (matches: { brand: ReconciledBrand; identityKey: string; method: "rd_uuid" | "email" | "name_phone" | "phone"; convertedAt: Date | null }[]) =>
    Array.from(new Map(matches.map(match => [`${match.brand}:${match.identityKey}`, match])).values());
  const uuidMatches = uniqueMatches(input.references
    .filter(reference => reference.rdContactUuid && input.row.rawPayload.includes(reference.rdContactUuid))
    .map(reference => ({ brand: reference.accountKey, identityKey: reference.identityHash, method: "rd_uuid" as const, convertedAt: reference.convertedAt ?? null })));

  const contactRaws = (input.linkedContacts ?? []).map(contact => parsePayload(contact.rawPayload));
  const emails = [input.row.email, ...multiValues(input.raw.EMAIL), ...(input.linkedContacts ?? []).flatMap(contact => [contact.email]), ...contactRaws.flatMap(raw => multiValues(raw.EMAIL))]
    .map(normalizeIdentityEmail).filter(Boolean) as string[];
  const phones = [input.row.phone, ...multiValues(input.raw.PHONE), ...(input.linkedContacts ?? []).flatMap(contact => [contact.phone]), ...contactRaws.flatMap(raw => multiValues(raw.PHONE))]
    .map(value => normalizeIdentityPhone(String(value ?? ""))).filter(Boolean) as string[];
  const names = [
    input.row.fullName,
    `${cleanText(input.raw.NAME, "")} ${cleanText(input.raw.LAST_NAME, "")}`,
    input.raw.NAME,
    ...(input.linkedContacts ?? []).flatMap(contact => [contact.fullName]),
    ...contactRaws.flatMap(raw => [`${cleanText(raw.NAME, "")} ${cleanText(raw.LAST_NAME, "")}`, raw.NAME]),
  ]
    .map(normalizeIdentityName).filter(Boolean);
  const matches: { brand: ReconciledBrand; identityKey: string; method: "rd_uuid" | "email" | "name_phone" | "phone"; convertedAt: Date | null }[] = [];
  for (const brand of ["medsystems", "beautysystems"] as const) {
    const phoneReferences = uniqueMatches(input.references.filter(reference => reference.accountKey === brand && phones.some(phone => reference.phoneHash === digestIdentity(input.identitySecret, phone) || reference.identityHash === digestIdentity(input.identitySecret, `${brand}|phone:${phone}`))).map(reference => ({ brand, identityKey: reference.identityHash, method: "phone" as const, convertedAt: reference.convertedAt ?? null })));
    if (phoneReferences.length === 1) matches.push(phoneReferences[0]!);
    const namePhoneReferences = input.references.filter(reference => reference.accountKey === brand && reference.namePhoneHash && names.some(name => phones.some(phone => reference.namePhoneHash === digestIdentity(input.identitySecret, `${name}|${phone}`))));
    matches.push(...namePhoneReferences.map(reference => ({ brand, identityKey: reference.identityHash, method: "name_phone" as const, convertedAt: reference.convertedAt ?? null })));
    const emailReferences = input.references.filter(reference => reference.accountKey === brand && emails.some(email => reference.emailHash === digestIdentity(input.identitySecret, email) || reference.identityHash === digestIdentity(input.identitySecret, `${brand}|email:${email}`)));
    matches.push(...emailReferences.map(reference => ({ brand, identityKey: reference.identityHash, method: "email" as const, convertedAt: reference.convertedAt ?? null })));
  }
  matches.push(...uuidMatches);
  const unique = uniqueMatches(matches);
  return unique;
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
  referenceRows: RdOpportunityReferenceIdentity[];
  identitySecret: string;
}) {
  const dealsByLead = new Map<string, Record<string, any>[]>();
  for (const row of input.dealRows ?? []) {
    const deal = parsePayload(row.rawPayload);
    const leadId = cleanText(deal.LEAD_ID, "");
    if (leadId) dealsByLead.set(leadId, [...(dealsByLead.get(leadId) ?? []), deal]);
  }
  const contactsById = new Map((input.contactRows ?? []).map(contact => [String(contact.bitrixId), contact]));
  return input.rows.filter(row => {
    const raw = parsePayload(row.rawPayload);
    const originalPipelineId = cleanText(raw.UF_CRM_1739195085, "unknown");
    const originalBrand: ReconciledBrand | null = originalPipelineId === "15391" ? "medsystems" : originalPipelineId === "15395" ? "beautysystems" : null;
    const directContactId = cleanText(raw.CONTACT_ID, "");
    const linkedContactIds = Array.from(new Set([
      directContactId === "0" ? "" : directContactId,
      ...(dealsByLead.get(String(row.bitrixId)) ?? []).map(deal => cleanText(deal.CONTACT_ID, "")),
    ].filter(value => value && value !== "0")));
    const linkedContacts = linkedContactIds.map(id => contactsById.get(id)).filter((contact): contact is RdOpportunityRawContact => Boolean(contact));
    return referenceMatchesForLead({
      row,
      raw,
      linkedContacts,
      references: input.referenceRows,
      identitySecret: input.identitySecret,
      originalBrand,
    }).length > 0;
  });
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
  const parsedDeals = (input.dealRows ?? []).map(row => parsePayload(row.rawPayload));
  const dealsByLead = new Map<string, Record<string, any>[]>();
  const dealsByContact = new Map<string, Record<string, any>[]>();
  const contactsById = new Map((input.contactRows ?? []).map(contact => [String(contact.bitrixId), contact]));
  for (const deal of parsedDeals) {
    const leadId = cleanText(deal.LEAD_ID, "");
    const contactId = cleanText(deal.CONTACT_ID, "");
    if (leadId) dealsByLead.set(leadId, [...(dealsByLead.get(leadId) ?? []), deal]);
    if (contactId && contactId !== "0") dealsByContact.set(contactId, [...(dealsByContact.get(contactId) ?? []), deal]);
  }

  const optionMaps = {
    pipelines: new Map<string, { label: string; identities: Set<string> }>(), responsibles: new Map<string, { label: string; identities: Set<string> }>(),
    sources: new Map<string, { label: string; identities: Set<string> }>(), stages: new Map<string, { label: string; identities: Set<string> }>(),
    positions: new Map<string, { label: string; identities: Set<string> }>(), products: new Map<string, { label: string; identities: Set<string> }>(),
    campaigns: new Map<string, { label: string; identities: Set<string> }>(), adsets: new Map<string, { label: string; identities: Set<string> }>(), creatives: new Map<string, { label: string; identities: Set<string> }>(),
  };

  const base = input.rows.flatMap(row => {
    const raw = parsePayload(row.rawPayload);
    const paidFieldMatch = cleanText(raw[PAID_TRAFFIC_FIELD], "").toLocaleLowerCase("pt-BR") === PAID_TRAFFIC_VALUE.toLocaleLowerCase("pt-BR");
    const originalPipelineId = cleanText(raw.UF_CRM_1739195085, "unknown");
    const originalBrand: ReconciledBrand | null = originalPipelineId === "15391" ? "medsystems" : originalPipelineId === "15395" ? "beautysystems" : null;
    const rawContactId = cleanText(raw.CONTACT_ID, "");
    const contactId = rawContactId === "0" ? "" : rawContactId;
    const leadDeals = dealsByLead.get(String(row.bitrixId)) ?? [];
    const linkedContactIds = Array.from(new Set([contactId, ...leadDeals.map(deal => cleanText(deal.CONTACT_ID, ""))].filter(value => value && value !== "0")));
    const linkedContacts = linkedContactIds.map(id => contactsById.get(id)).filter((contact): contact is RdOpportunityRawContact => Boolean(contact));
    const referenceMatches = referenceMatchesForLead({
      row,
      raw,
      linkedContacts,
      references: input.referenceRows ?? [],
      identitySecret: input.identitySecret ?? "",
      originalBrand,
    });
    if (!referenceMatches.length) return [];
    const responsibleId = cleanText(raw.ASSIGNED_BY_ID, "unknown");
    const stageId = cleanText(raw.STATUS_ID ?? row.stageOrStatus, "unknown");
    const fields = attributionFields(raw);
    const linkedDealCandidates = [...leadDeals, ...linkedContactIds.flatMap(id => dealsByContact.get(id) ?? [])];
    const seenDeals = new Set<string>();
    const linkedDeals = linkedDealCandidates.filter((deal, index) => {
      const key = cleanText(deal.ID, `sem-id-${index}`);
      if (seenDeals.has(key)) return false;
      seenDeals.add(key);
      return true;
    });
    const directEmails = [row.email, ...multiValues(raw.EMAIL), ...linkedContacts.flatMap(contact => [contact.email])].map(normalizeIdentityEmail).filter(Boolean) as string[];
    const directPhones = [row.phone, ...multiValues(raw.PHONE), ...linkedContacts.flatMap(contact => [contact.phone])].map(value => normalizeIdentityPhone(String(value ?? ""))).filter(Boolean) as string[];
    const directNames = [row.fullName, `${cleanText(raw.NAME, "")} ${cleanText(raw.LAST_NAME, "")}`, ...linkedContacts.flatMap(contact => [contact.fullName])].map(normalizeIdentityName).filter(Boolean);
    const fallbackIdentityKey = (linkedContactIds.length ? `contact:${linkedContactIds.sort()[0]}` : null)
      ?? (directEmails[0] ? `email:${directEmails[0]}` : null)
      ?? (directNames[0] && directPhones[0] ? `name_phone:${directNames[0]}|${directPhones[0]}` : null)
      ?? (directPhones[0] ? `phone:${directPhones[0]}` : `lead:${row.bitrixId}`);
    return (referenceMatches.length ? referenceMatches : [null]).map(referenceMatch => {
      const pipelineId = referenceMatch ? RECONCILED_PIPELINE_BY_BRAND[referenceMatch.brand] : originalPipelineId;
      const identityKey = referenceMatch?.identityKey ?? fallbackIdentityKey;
      const item = {
        row, raw, linkedDeals, pipelineId, pipelineLabel: PIPELINE_LABELS[pipelineId] ?? (pipelineId === "unknown" ? "Não identificado" : `Pipeline #${pipelineId}`),
        responsibleId, responsibleLabel: RESPONSIBLE_LABELS[responsibleId] ?? (responsibleId === "unknown" ? "Não identificado" : `Responsável #${responsibleId}`),
        stageId, stageLabel: STATUS_LABELS[stageId] ?? (stageId === "unknown" ? "Não identificado" : `Etapa #${stageId}`),
        positionLabel: cleanText(raw.POST), productLabel: cleanText(raw.UF_CRM_1738950946), paidFieldMatch,
        identityKey, reconciledByIdentity: Boolean(referenceMatch), referenceIdentityKey: referenceMatch?.identityKey ?? null,
        referenceMatchMethod: referenceMatch?.method ?? null, sourceConvertedAt: referenceMatch?.convertedAt ?? null, ...fields,
      };
      for (const [map, value, label] of [
        [optionMaps.pipelines, item.pipelineId, item.pipelineLabel], [optionMaps.responsibles, item.responsibleId, item.responsibleLabel],
        [optionMaps.sources, item.source, item.source], [optionMaps.stages, item.stageId, item.stageLabel], [optionMaps.positions, item.positionLabel, item.positionLabel],
        [optionMaps.products, item.productLabel, item.productLabel], [optionMaps.campaigns, item.campaign, item.campaign], [optionMaps.adsets, item.adset, item.adset], [optionMaps.creatives, item.creative, item.creative],
      ] as const) {
        const current = map.get(value) ?? { label, identities: new Set<string>() };
        current.identities.add(identityKey);
        map.set(value, current);
      }
      return item;
    });
  });

  const eligibleRows = base.filter(item =>
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

  const identityGroups = new Map<string, typeof eligibleRows>();
  for (const item of eligibleRows) identityGroups.set(item.identityKey, [...(identityGroups.get(item.identityKey) ?? []), item]);
  const stagePriority = (item: (typeof eligibleRows)[number]) => item.linkedDeals.some(deal => cleanText(deal.STAGE_SEMANTIC_ID, "") === "S") ? 50
    : item.linkedDeals.length ? 40 : SQL_STATUSES.has(item.stageId) ? 30 : MQL_STATUSES.has(item.stageId) ? 20 : LOST_STATUSES.has(item.stageId) ? 10 : 0;
  const eligible = Array.from(identityGroups.values()).map(group => {
    const canonical = [...group].sort((a, b) => stagePriority(b) - stagePriority(a) || b.row.createdAtBitrix.getTime() - a.row.createdAtBitrix.getTime() || b.row.bitrixId - a.row.bitrixId)[0]!;
    const mergedDeals = Array.from(new Map(group.flatMap(item => item.linkedDeals).map((deal, index) => [cleanText(deal.ID, `sem-id-${index}`), deal])).values());
    return {
      ...canonical,
      linkedDeals: mergedDeals,
      bitrixLeadIds: Array.from(new Set(group.map(item => item.row.bitrixId))),
      reconciledByIdentity: group.some(item => item.reconciledByIdentity),
      paidFieldMatch: group.some(item => item.paidFieldMatch),
    };
  });

  const distributions = {
    responsible: new Map<string, number>(), source: new Map<string, number>(), stages: new Map<string, number>(),
    positions: new Map<string, number>(), products: new Map<string, number>(), campaigns: new Map<string, number>(),
  };
  const daily = new Map<string, { leads: number; mql: number; sql: number; deals: number }>();
  const coverage = { source: 0, medium: 0, campaign: 0, adset: 0, creative: 0, responsible: 0, linkedDeal: 0 };
  const attribution = new Map<string, { source: string; medium: string; campaign: string; adset: string; creative: string; leads: number; mql: number; sql: number; deals: number; wonDeals: number; dealValue: number; wonValue: number }>();
  let mql = 0, sql = 0, dealLeads = 0, wonLeadCount = 0, dealCount = 0, wonDeals = 0, openDeals = 0, lostDeals = 0, totalDealValue = 0, wonValue = 0;

  for (const item of eligible) {
    const hasDeal = item.linkedDeals.length > 0;
    const isMql = MQL_STATUSES.has(item.stageId) || hasDeal;
    const isSql = SQL_STATUSES.has(item.stageId) || hasDeal;
    const wonForLead = item.linkedDeals.filter(deal => cleanText(deal.STAGE_SEMANTIC_ID, "") === "S");
    if (isMql) mql += 1;
    if (isSql) sql += 1;
    if (hasDeal) dealLeads += 1;
    if (wonForLead.length) wonLeadCount += 1;
    const day = dayKey(item.sourceConvertedAt ?? item.row.createdAtBitrix);
    const dayItem = daily.get(day) ?? { leads: 0, mql: 0, sql: 0, deals: 0 };
    dayItem.leads += 1; dayItem.mql += isMql ? 1 : 0; dayItem.sql += isSql ? 1 : 0; dayItem.deals += hasDeal ? 1 : 0; daily.set(day, dayItem);
    addCount(distributions.responsible, item.responsibleLabel); addCount(distributions.source, item.source); addCount(distributions.stages, item.stageLabel);
    addCount(distributions.positions, item.positionLabel); addCount(distributions.products, item.productLabel); addCount(distributions.campaigns, item.campaign);
    if (item.source !== "Não identificado") coverage.source += 1; if (item.medium !== "Não identificado") coverage.medium += 1;
    if (item.campaign !== "Não identificado") coverage.campaign += 1; if (item.adset !== "Não identificado") coverage.adset += 1;
    if (item.creative !== "Não identificado") coverage.creative += 1; if (item.responsibleId !== "unknown") coverage.responsible += 1; if (hasDeal) coverage.linkedDeal += 1;
    const key = [item.source, item.medium, item.campaign, item.adset, item.creative].join("\u0001");
    const attr = attribution.get(key) ?? { source: item.source, medium: item.medium, campaign: item.campaign, adset: item.adset, creative: item.creative, leads: 0, mql: 0, sql: 0, deals: 0, wonDeals: 0, dealValue: 0, wonValue: 0 };
    attr.leads += 1; attr.mql += isMql ? 1 : 0; attr.sql += isSql ? 1 : 0;
    for (const deal of item.linkedDeals) {
      const value = numberValue(deal.OPPORTUNITY);
      attr.deals += 1; attr.dealValue += value; dealCount += 1; totalDealValue += value;
      const semantic = cleanText(deal.STAGE_SEMANTIC_ID, "");
      if (semantic === "S") { attr.wonDeals += 1; attr.wonValue += value; wonDeals += 1; wonValue += value; }
      else if (semantic === "F") lostDeals += 1;
      else openDeals += 1;
    }
    attribution.set(key, attr);
  }

  const leads = eligible.length;
  const duplicateIdentityGroups = new Map<string, { leadIds: Set<number>; brand: string; campaigns: Set<string>; method: string }>();
  for (const item of eligibleRows) {
    const current = duplicateIdentityGroups.get(item.identityKey) ?? {
      leadIds: new Set<number>(), brand: item.pipelineLabel, campaigns: new Set<string>(), method: item.referenceMatchMethod ?? "Não identificado",
    };
    current.leadIds.add(item.row.bitrixId);
    current.campaigns.add(item.campaign);
    duplicateIdentityGroups.set(item.identityKey, current);
  }
  const duplicateGroups = Array.from(duplicateIdentityGroups.values()).filter(group => group.leadIds.size > 1);
  const duplicateByBrand = new Map<string, number>();
  const duplicateByCampaign = new Map<string, number>();
  const duplicateByMethod = new Map<string, number>();
  for (const group of duplicateGroups) {
    addCount(duplicateByBrand, group.brand);
    addCount(duplicateByMethod, group.method);
    for (const campaign of Array.from(group.campaigns)) addCount(duplicateByCampaign, campaign);
  }
  const funnel = [
    { key: "lead", label: "Leads", count: leads, conversionFromPrevious: 100, conversionFromLead: 100, rule: "Contato único da fonte localizado no Bitrix24; campos do CRM são dimensões, não filtros de exclusão" },
    { key: "mql", label: "MQL · Qualificados", count: mql, conversionFromPrevious: rate(mql, leads), conversionFromLead: rate(mql, leads), rule: "Primeiro Contato ou etapa posterior; também inclui lead com negócio vinculado" },
    { key: "sql", label: "SQL · Oportunidades", count: sql, conversionFromPrevious: rate(sql, mql), conversionFromLead: rate(sql, leads), rule: "Relacionamento, Converter Lead ou Convertido; também inclui lead com negócio vinculado" },
    { key: "deal", label: "Negócios", count: dealLeads, conversionFromPrevious: rate(dealLeads, sql), conversionFromLead: rate(dealLeads, leads), rule: "Lead com negócio vinculado por LEAD_ID ou CONTACT_ID" },
    { key: "won", label: "Ganhos", count: wonLeadCount, conversionFromPrevious: rate(wonLeadCount, dealLeads), conversionFromLead: rate(wonLeadCount, leads), rule: "Negócio vinculado com semântica de ganho" },
  ];

  return {
    sourceRule: "Identidade da fonte conciliada no Bitrix24; deduplicação por contato único",
    period: input.period,
    selectedFilters: input.filters,
    filterOptions: Object.fromEntries(Object.entries(optionMaps).map(([key, map]) => [key, optionRows(map)])),
    totals: { leads, uniqueContacts: leads, uniqueBitrixLeadIds: new Set(eligibleRows.map(item => item.row.bitrixId)).size, mql, sql, dealLeads, wonLeadCount, dealCount, wonDeals, openDeals, lostDeals, totalDealValue, wonValue, discardedLeads: eligible.filter(item => LOST_STATUSES.has(item.stageId)).length, reconciledByIdentity: eligible.filter(item => item.reconciledByIdentity).length, reconciledOutsidePaidField: eligible.filter(item => item.reconciledByIdentity && !item.paidFieldMatch).length },
    funnel,
    coverage,
    byDay: Array.from(daily, ([date, values]) => ({ date, ...values })).sort((a, b) => a.date.localeCompare(b.date)),
    stages: countRows(distributions.stages), responsible: countRows(distributions.responsible), sourceInformation: countRows(distributions.source),
    positions: countRows(distributions.positions), products: countRows(distributions.products), campaigns: countRows(distributions.campaigns),
    duplicates: {
      peopleWithMultipleLeadIds: duplicateGroups.length,
      leadIdsInDuplicateGroups: duplicateGroups.reduce((sum, group) => sum + group.leadIds.size, 0),
      extraLeadIds: duplicateGroups.reduce((sum, group) => sum + group.leadIds.size - 1, 0),
      byBrand: countRows(duplicateByBrand), byCampaign: countRows(duplicateByCampaign), byMatchMethod: countRows(duplicateByMethod),
    },
    attribution: Array.from(attribution.values()).sort((a, b) => b.deals - a.deals || b.leads - a.leads || a.campaign.localeCompare(b.campaign)),
    methodology: {
      mql: "Etapa atual em Primeiro Contato, Segundo Contato, Terceiro Contato, Relacionamento, Converter Lead ou Convertido; ou negócio vinculado.",
      sql: "Etapa atual em Relacionamento, Converter Lead ou Convertido; ou negócio vinculado.",
      deal: "Vínculo por LEAD_ID e, quando disponível, CONTACT_ID.",
      attribution: "UTMs diretas do lead; fallback para o payload RD Station embutido. Nesta operação, UTM content representa conjunto/grupo e UTM term representa criativo; ausências aparecem como Não identificado.",
      reconciliation: "A unidade oficial é o contato único conciliado no Bitrix24. O universo parte da evidência paga do RD e do padrão observado na base de referência; título, origem, pipeline e data são dimensões de leitura, não filtros excludentes isolados. UUID, e-mail, nome + telefone e telefone normalizado formam o de-para, e a BU conciliada prevalece apenas quando o match é inequívoco.",
      limitation: "O funil usa a etapa atual e vínculos persistidos. Sem histórico de transição completo, descartados que passaram por etapas anteriores não são retroativamente reclassificados.",
    },
  };
}

type RdOpportunityDataset = {
  rows: RdOpportunityRawLead[];
  dealRows: RdOpportunityRawDeal[];
  contactRows: RdOpportunityRawContact[];
  referenceRows: RdOpportunityReferenceIdentity[];
  identitySecret: string;
};

const LEAD_SCAN_PAGE_SIZE = 250;
const LOOKUP_CHUNK_SIZE = 200;

async function loadRdOpportunityDataset(input: {
  portal: string;
  start: Date;
  end: Date;
}): Promise<RdOpportunityDataset> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const database = db;
  const [historicalReferenceRows, rdEvents, dealLinks] = await Promise.all([
    db.select({ accountKey: leadReferenceEvents.accountKey, identityHash: leadReferenceEvents.identityHash, emailHash: leadReferenceEvents.emailHash, phoneHash: leadReferenceEvents.phoneHash, namePhoneHash: leadReferenceEvents.namePhoneHash, rdContactUuid: leadReferenceEvents.rdContactUuid, convertedAt: leadReferenceEvents.convertedAt }).from(leadReferenceEvents)
      .where(and(gte(leadReferenceEvents.convertedAt, input.start), lt(leadReferenceEvents.convertedAt, input.end))),
    db.select({ accountKey: rdStationConversionEvents.accountKey, contactUuid: rdStationConversionEvents.contactUuid, rawPayload: rdStationConversionEvents.rawPayload, eventCreatedAt: rdStationConversionEvents.eventCreatedAt })
      .from(rdStationConversionEvents).where(and(gte(rdStationConversionEvents.eventCreatedAt, input.start), lt(rdStationConversionEvents.eventCreatedAt, input.end))),
    db.select({
      bitrixId: bitrix24Entities.bitrixId,
      leadId: sql<string | null>`json_unquote(json_extract(${bitrix24Entities.rawPayload}, '$.LEAD_ID'))`,
      contactId: sql<string | null>`json_unquote(json_extract(${bitrix24Entities.rawPayload}, '$.CONTACT_ID'))`,
    }).from(bitrix24Entities).where(and(eq(bitrix24Entities.portal, input.portal), eq(bitrix24Entities.entityType, "deal"))),
  ]);
  const rdContactUuids = Array.from(new Set(rdEvents.map(event => event.contactUuid)));
  const rdContacts = rdContactUuids.length ? await db.select({ accountKey: rdStationContacts.accountKey, contactUuid: rdStationContacts.contactUuid, name: rdStationContacts.name, email: rdStationContacts.email, phone: rdStationContacts.phone })
    .from(rdStationContacts).where(inArray(rdStationContacts.contactUuid, rdContactUuids)) : [];
  const dynamicReferences = buildPaidMediaReferenceIdentities({ events: rdEvents, contacts: rdContacts, identitySecret: process.env.JWT_SECRET ?? "" });
  const referenceRows = mergePaidMediaReferenceIdentities(
    historicalReferenceRows as RdOpportunityReferenceIdentity[],
    dynamicReferences,
  );
  const identitySecret = process.env.JWT_SECRET ?? "";
  if (!referenceRows.length) return { rows: [], dealRows: [], contactRows: [], referenceRows, identitySecret };

  const dealsByLead = new Map<string, typeof dealLinks>();
  for (const deal of dealLinks) {
    const leadId = cleanText(deal.leadId, "");
    if (leadId) dealsByLead.set(leadId, [...(dealsByLead.get(leadId) ?? []), deal]);
  }
  const contactCache = new Map<string, RdOpportunityRawContact>();
  const candidateContacts = new Map<string, RdOpportunityRawContact>();
  const candidateLeadIds = new Set<number>();
  const candidateContactIds = new Set<number>();
  const rows: RdOpportunityRawLead[] = [];

  async function loadContacts(ids: number[]) {
    const missing = Array.from(new Set(ids)).filter(id => !contactCache.has(String(id)));
    for (let index = 0; index < missing.length; index += LOOKUP_CHUNK_SIZE) {
      const chunk = missing.slice(index, index + LOOKUP_CHUNK_SIZE);
      if (!chunk.length) continue;
      const contacts = await database.select({ bitrixId: bitrix24Entities.bitrixId, fullName: bitrix24Entities.fullName, email: bitrix24Entities.email, phone: bitrix24Entities.phone, rawPayload: bitrix24Entities.rawPayload })
        .from(bitrix24Entities).where(and(eq(bitrix24Entities.portal, input.portal), eq(bitrix24Entities.entityType, "contact"), inArray(bitrix24Entities.bitrixId, chunk)));
      for (const contact of contacts) contactCache.set(String(contact.bitrixId), contact);
    }
  }

  let cursor = 0;
  while (true) {
    const page = await db.select({ bitrixId: bitrix24Entities.bitrixId, createdAtBitrix: bitrix24Entities.createdAtBitrix, stageOrStatus: bitrix24Entities.stageOrStatus, rawPayload: bitrix24Entities.rawPayload, fullName: bitrix24Entities.fullName, email: bitrix24Entities.email, phone: bitrix24Entities.phone })
      .from(bitrix24Entities)
      .where(and(eq(bitrix24Entities.portal, input.portal), eq(bitrix24Entities.entityType, "lead"), gt(bitrix24Entities.bitrixId, cursor)))
      .orderBy(asc(bitrix24Entities.bitrixId)).limit(LEAD_SCAN_PAGE_SIZE);
    if (!page.length) break;
    const pageContactIds = Array.from(new Set(page.flatMap(row => {
      const raw = parsePayload(row.rawPayload);
      return [cleanText(raw.CONTACT_ID, ""), ...(dealsByLead.get(String(row.bitrixId)) ?? []).map(deal => cleanText(deal.contactId, ""))]
        .map(Number).filter(id => Number.isInteger(id) && id > 0);
    })));
    await loadContacts(pageContactIds);
    const pageContacts = pageContactIds.map(id => contactCache.get(String(id))).filter((contact): contact is RdOpportunityRawContact => Boolean(contact));
    const linkRows = page.flatMap(row => (dealsByLead.get(String(row.bitrixId)) ?? []).map(deal => ({ rawPayload: JSON.stringify({ ID: deal.bitrixId, LEAD_ID: deal.leadId, CONTACT_ID: deal.contactId }) })));
    const candidates = rdOpportunityCandidateRows({ rows: page, dealRows: linkRows, contactRows: pageContacts, referenceRows, identitySecret });
    for (const row of candidates) {
      rows.push(row);
      candidateLeadIds.add(row.bitrixId);
      const raw = parsePayload(row.rawPayload);
      const linkedIds = [cleanText(raw.CONTACT_ID, ""), ...(dealsByLead.get(String(row.bitrixId)) ?? []).map(deal => cleanText(deal.contactId, ""))]
        .map(Number).filter(id => Number.isInteger(id) && id > 0);
      for (const id of linkedIds) {
        candidateContactIds.add(id);
        const contact = contactCache.get(String(id));
        if (contact) candidateContacts.set(String(id), contact);
      }
    }
    cursor = page[page.length - 1]!.bitrixId;
    if (page.length < LEAD_SCAN_PAGE_SIZE) break;
  }

  const relevantDealIds = dealLinks.filter(deal => candidateLeadIds.has(Number(deal.leadId)) || candidateContactIds.has(Number(deal.contactId))).map(deal => deal.bitrixId);
  const dealRows: RdOpportunityRawDeal[] = [];
  for (let index = 0; index < relevantDealIds.length; index += LOOKUP_CHUNK_SIZE) {
    const chunk = relevantDealIds.slice(index, index + LOOKUP_CHUNK_SIZE);
    if (!chunk.length) continue;
    dealRows.push(...await db.select({ rawPayload: bitrix24Entities.rawPayload }).from(bitrix24Entities)
      .where(and(eq(bitrix24Entities.portal, input.portal), eq(bitrix24Entities.entityType, "deal"), inArray(bitrix24Entities.bitrixId, chunk))));
  }
  return { rows, dealRows, contactRows: Array.from(candidateContacts.values()), referenceRows, identitySecret };
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
