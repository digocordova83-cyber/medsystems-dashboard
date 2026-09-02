import { createHmac } from "node:crypto";
import { and, eq, gte, inArray, lt } from "drizzle-orm";
import { bitrix24Entities, leadReferenceEvents } from "../../drizzle/schema";
import { getDb, normalizeIdentityEmail, normalizeIdentityPhone } from "../db";

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

export type RdOpportunityRawLead = { bitrixId: number; createdAtBitrix: Date; stageOrStatus: string | null; rawPayload: string; email?: string | null; phone?: string | null };
export type RdOpportunityRawDeal = { rawPayload: string };
export type RdOpportunityRawContact = { bitrixId: number; email: string | null; phone: string | null; rawPayload: string };
export type RdOpportunityReferenceIdentity = { accountKey: "medsystems" | "beautysystems"; identityHash: string; rdContactUuid: string | null };
type CountRow = { label: string; count: number };
type OptionRow = { value: string; label: string; count: number };

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
function optionRows(map: Map<string, { label: string; count: number }>): OptionRow[] { return Array.from(map, ([value, item]) => ({ value, ...item })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)); }
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

function referenceBrandForLead(input: {
  row: RdOpportunityRawLead;
  raw: Record<string, any>;
  linkedContact?: RdOpportunityRawContact;
  references: RdOpportunityReferenceIdentity[];
  identitySecret: string;
  originalBrand: ReconciledBrand | null;
}) {
  if (!input.references.length) return null;
  const uuidBrands = new Set(input.references.filter(reference => reference.rdContactUuid && input.row.rawPayload.includes(reference.rdContactUuid)).map(reference => reference.accountKey));
  if (uuidBrands.size === 1) return Array.from(uuidBrands)[0]!;

  const contactRaw = input.linkedContact ? parsePayload(input.linkedContact.rawPayload) : {};
  const emails = [input.row.email, ...multiValues(input.raw.EMAIL), input.linkedContact?.email, ...multiValues(contactRaw.EMAIL)]
    .map(normalizeIdentityEmail).filter(Boolean) as string[];
  const phones = [input.row.phone, ...multiValues(input.raw.PHONE), input.linkedContact?.phone, ...multiValues(contactRaw.PHONE)]
    .map(value => normalizeIdentityPhone(String(value ?? ""))).filter(Boolean) as string[];
  const referenceHashes = new Map<ReconciledBrand, Set<string>>([
    ["medsystems", new Set(input.references.filter(row => row.accountKey === "medsystems").map(row => row.identityHash))],
    ["beautysystems", new Set(input.references.filter(row => row.accountKey === "beautysystems").map(row => row.identityHash))],
  ]);
  const matchedBrands = new Set<ReconciledBrand>();
  for (const brand of ["medsystems", "beautysystems"] as const) {
    const hashes = referenceHashes.get(brand)!;
    if (emails.some(email => hashes.has(digestIdentity(input.identitySecret, `${brand}|email:${email}`)))) matchedBrands.add(brand);
    if (phones.some(phone => hashes.has(digestIdentity(input.identitySecret, `${brand}|phone:${phone}`)))) matchedBrands.add(brand);
  }
  if (input.originalBrand && matchedBrands.has(input.originalBrand)) return input.originalBrand;
  return matchedBrands.size === 1 ? Array.from(matchedBrands)[0]! : null;
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

export function buildRdOpportunityManagerDashboard(input: {
  rows: RdOpportunityRawLead[];
  dealRows?: RdOpportunityRawDeal[];
  contactRows?: RdOpportunityRawContact[];
  referenceRows?: RdOpportunityReferenceIdentity[];
  identitySecret?: string;
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
    pipelines: new Map<string, { label: string; count: number }>(), responsibles: new Map<string, { label: string; count: number }>(),
    sources: new Map<string, { label: string; count: number }>(), stages: new Map<string, { label: string; count: number }>(),
    positions: new Map<string, { label: string; count: number }>(), products: new Map<string, { label: string; count: number }>(),
    campaigns: new Map<string, { label: string; count: number }>(), adsets: new Map<string, { label: string; count: number }>(), creatives: new Map<string, { label: string; count: number }>(),
  };

  const base = input.rows.flatMap(row => {
    const raw = parsePayload(row.rawPayload);
    const paidFieldMatch = cleanText(raw[PAID_TRAFFIC_FIELD], "").toLocaleLowerCase("pt-BR") === PAID_TRAFFIC_VALUE.toLocaleLowerCase("pt-BR");
    const originalPipelineId = cleanText(raw.UF_CRM_1739195085, "unknown");
    const originalBrand: ReconciledBrand | null = originalPipelineId === "15391" ? "medsystems" : originalPipelineId === "15395" ? "beautysystems" : null;
    const rawContactId = cleanText(raw.CONTACT_ID, "");
    const contactId = rawContactId === "0" ? "" : rawContactId;
    const reconciledBrand = referenceBrandForLead({
      row,
      raw,
      linkedContact: contactId ? contactsById.get(contactId) : undefined,
      references: input.referenceRows ?? [],
      identitySecret: input.identitySecret ?? "",
      originalBrand,
    });
    if (!paidFieldMatch && !reconciledBrand) return [];
    const pipelineId = reconciledBrand ? RECONCILED_PIPELINE_BY_BRAND[reconciledBrand] : originalPipelineId;
    const responsibleId = cleanText(raw.ASSIGNED_BY_ID, "unknown");
    const stageId = cleanText(raw.STATUS_ID ?? row.stageOrStatus, "unknown");
    const fields = attributionFields(raw);
    const linkedDealCandidates = [...(dealsByLead.get(String(row.bitrixId)) ?? []), ...(contactId ? dealsByContact.get(contactId) ?? [] : [])];
    const seenDeals = new Set<string>();
    const linkedDeals = linkedDealCandidates.filter((deal, index) => {
      const key = cleanText(deal.ID, `sem-id-${index}`);
      if (seenDeals.has(key)) return false;
      seenDeals.add(key);
      return true;
    });
    const item = {
      row, raw, linkedDeals, pipelineId, pipelineLabel: PIPELINE_LABELS[pipelineId] ?? (pipelineId === "unknown" ? "Não identificado" : `Pipeline #${pipelineId}`),
      responsibleId, responsibleLabel: RESPONSIBLE_LABELS[responsibleId] ?? (responsibleId === "unknown" ? "Não identificado" : `Responsável #${responsibleId}`),
      stageId, stageLabel: STATUS_LABELS[stageId] ?? (stageId === "unknown" ? "Não identificado" : `Etapa #${stageId}`),
      positionLabel: cleanText(raw.POST), productLabel: cleanText(raw.UF_CRM_1738950946), paidFieldMatch, reconciledByIdentity: Boolean(reconciledBrand), ...fields,
    };
    for (const [map, value, label] of [
      [optionMaps.pipelines, item.pipelineId, item.pipelineLabel], [optionMaps.responsibles, item.responsibleId, item.responsibleLabel],
      [optionMaps.sources, item.source, item.source], [optionMaps.stages, item.stageId, item.stageLabel], [optionMaps.positions, item.positionLabel, item.positionLabel],
      [optionMaps.products, item.productLabel, item.productLabel], [optionMaps.campaigns, item.campaign, item.campaign], [optionMaps.adsets, item.adset, item.adset], [optionMaps.creatives, item.creative, item.creative],
    ] as const) {
      const current = map.get(value) ?? { label, count: 0 };
      current.count += 1;
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
    const day = dayKey(item.row.createdAtBitrix);
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
  const funnel = [
    { key: "lead", label: "Leads", count: leads, conversionFromPrevious: 100, conversionFromLead: 100, rule: "Registro Bitrix24 com Tráfego Pago ou match de identidade na referência" },
    { key: "mql", label: "MQL · Qualificados", count: mql, conversionFromPrevious: rate(mql, leads), conversionFromLead: rate(mql, leads), rule: "Primeiro Contato ou etapa posterior; também inclui lead com negócio vinculado" },
    { key: "sql", label: "SQL · Oportunidades", count: sql, conversionFromPrevious: rate(sql, mql), conversionFromLead: rate(sql, leads), rule: "Relacionamento, Converter Lead ou Convertido; também inclui lead com negócio vinculado" },
    { key: "deal", label: "Negócios", count: dealLeads, conversionFromPrevious: rate(dealLeads, sql), conversionFromLead: rate(dealLeads, leads), rule: "Lead com negócio vinculado por LEAD_ID ou CONTACT_ID" },
    { key: "won", label: "Ganhos", count: wonLeadCount, conversionFromPrevious: rate(wonLeadCount, dealLeads), conversionFromLead: rate(wonLeadCount, leads), rule: "Negócio vinculado com semântica de ganho" },
  ];

  return {
    sourceRule: `${PAID_TRAFFIC_FIELD} = ${PAID_TRAFFIC_VALUE} ou match de identidade`,
    period: input.period,
    selectedFilters: input.filters,
    filterOptions: Object.fromEntries(Object.entries(optionMaps).map(([key, map]) => [key, optionRows(map)])),
    totals: { leads, mql, sql, dealLeads, wonLeadCount, dealCount, wonDeals, openDeals, lostDeals, totalDealValue, wonValue, discardedLeads: eligible.filter(item => LOST_STATUSES.has(item.stageId)).length, reconciledByIdentity: eligible.filter(item => item.reconciledByIdentity).length, reconciledOutsidePaidField: eligible.filter(item => item.reconciledByIdentity && !item.paidFieldMatch).length },
    funnel,
    coverage,
    byDay: Array.from(daily, ([date, values]) => ({ date, ...values })).sort((a, b) => a.date.localeCompare(b.date)),
    stages: countRows(distributions.stages), responsible: countRows(distributions.responsible), sourceInformation: countRows(distributions.source),
    positions: countRows(distributions.positions), products: countRows(distributions.products), campaigns: countRows(distributions.campaigns),
    attribution: Array.from(attribution.values()).sort((a, b) => b.deals - a.deals || b.leads - a.leads || a.campaign.localeCompare(b.campaign)),
    methodology: {
      mql: "Etapa atual em Primeiro Contato, Segundo Contato, Terceiro Contato, Relacionamento, Converter Lead ou Convertido; ou negócio vinculado.",
      sql: "Etapa atual em Relacionamento, Converter Lead ou Convertido; ou negócio vinculado.",
      deal: "Vínculo por LEAD_ID e, quando disponível, CONTACT_ID.",
      attribution: "UTMs diretas do lead; fallback para o payload RD Station embutido. Nesta operação, UTM content representa conjunto/grupo e UTM term representa criativo; ausências aparecem como Não identificado.",
      reconciliation: "O universo inclui somente entidades do Bitrix24. Além do campo Tráfego Pago, um lead pode entrar por match seguro de UUID RD, e-mail ou telefone normalizado com a referência do período; a BU conciliada prevalece apenas quando o match é inequívoco.",
      limitation: "O funil usa a etapa atual e vínculos persistidos. Sem histórico de transição completo, descartados que passaram por etapas anteriores não são retroativamente reclassificados.",
    },
  };
}

export async function rdOpportunityManagerDashboard(input: {
  portal: string;
  start: Date;
  end: Date;
  startDate: string;
  endDate: string;
  filters: RdOpportunityFilters;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const [rows, dealRows, referenceRows] = await Promise.all([
    db.select({ bitrixId: bitrix24Entities.bitrixId, createdAtBitrix: bitrix24Entities.createdAtBitrix, stageOrStatus: bitrix24Entities.stageOrStatus, rawPayload: bitrix24Entities.rawPayload, email: bitrix24Entities.email, phone: bitrix24Entities.phone })
      .from(bitrix24Entities).where(and(
        eq(bitrix24Entities.portal, input.portal),
        eq(bitrix24Entities.entityType, "lead"),
        gte(bitrix24Entities.createdAtBitrix, input.start),
        lt(bitrix24Entities.createdAtBitrix, input.end),
      )),
    db.select({ rawPayload: bitrix24Entities.rawPayload }).from(bitrix24Entities)
      .where(and(eq(bitrix24Entities.portal, input.portal), eq(bitrix24Entities.entityType, "deal"))),
    db.select({ accountKey: leadReferenceEvents.accountKey, identityHash: leadReferenceEvents.identityHash, rdContactUuid: leadReferenceEvents.rdContactUuid }).from(leadReferenceEvents)
      .where(and(gte(leadReferenceEvents.convertedAt, input.start), lt(leadReferenceEvents.convertedAt, input.end))),
  ]);
  const contactIds = Array.from(new Set(rows.map(row => {
    const raw = parsePayload(row.rawPayload);
    const value = cleanText(raw.CONTACT_ID, "");
    return value && value !== "0" ? Number(value) : null;
  }).filter((value): value is number => Number.isFinite(value))));
  const contactRows = contactIds.length ? await db.select({ bitrixId: bitrix24Entities.bitrixId, email: bitrix24Entities.email, phone: bitrix24Entities.phone, rawPayload: bitrix24Entities.rawPayload })
    .from(bitrix24Entities).where(and(eq(bitrix24Entities.portal, input.portal), eq(bitrix24Entities.entityType, "contact"), inArray(bitrix24Entities.bitrixId, contactIds))) : [];
  return buildRdOpportunityManagerDashboard({ rows, dealRows, contactRows, referenceRows, identitySecret: process.env.JWT_SECRET ?? "", filters: input.filters, period: { start: input.startDate, end: input.endDate } });
}
