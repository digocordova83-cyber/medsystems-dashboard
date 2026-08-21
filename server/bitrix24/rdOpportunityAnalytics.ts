import { and, eq, gte, lt } from "drizzle-orm";
import { bitrix24Entities } from "../../drizzle/schema";
import { getDb } from "../db";

export const RD_OPPORTUNITY_LEAD_TITLE = "Oportunidade do RD Station";
export const BITRIX_EVENT_SOURCE_ID = "UC_45K0VX";

const PIPELINE_LABELS: Record<string, string> = {
  "15389": "Advance", "15391": "Medsystems", "15393": "Reface", "15395": "Negócios e Redes", "15397": "Canfield", "15399": "Aeskins",
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

export type RdOpportunityFilters = {
  pipeline: string;
  responsible: string;
  source: string;
  stage: string;
  position: string;
  product: string;
};

export type RdOpportunityRawLead = { bitrixId: number; createdAtBitrix: Date; stageOrStatus: string | null; rawPayload: string };
export type RdOpportunityRawDeal = { rawPayload: string };
type CountRow = { label: string; count: number };
type OptionRow = { value: string; label: string; count: number };

function cleanText(value: unknown, fallback = "Não informado") {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text || ["undefined", "null", "unknown"].includes(text.toLowerCase())) return fallback;
  return text;
}

function safeSourceDescription(value: unknown) {
  const text = cleanText(value);
  if (text === "Não informado") return text;
  if (/@/.test(text) || /(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?\d{4,5}[-\s]?\d{4}/.test(text)) return "Informação restrita";
  return text.length > 90 ? `${text.slice(0, 87)}…` : text;
}

function parsePayload(rawPayload: string) {
  try { return JSON.parse(rawPayload) as Record<string, unknown>; } catch { return {}; }
}

function addCount(map: Map<string, number>, label: string) { map.set(label, (map.get(label) ?? 0) + 1); }
function countRows(map: Map<string, number>): CountRow[] { return Array.from(map, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)); }
function optionRows(map: Map<string, { label: string; count: number }>): OptionRow[] { return Array.from(map, ([value, item]) => ({ value, ...item })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)); }
function dayKey(date: Date) { return date.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }); }
function dateFromPayload(value: unknown) { const date = new Date(String(value ?? "")); return Number.isNaN(date.getTime()) ? null : date; }
function numberValue(value: unknown) { const parsed = Number(value ?? 0); return Number.isFinite(parsed) ? parsed : 0; }

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
  filters: RdOpportunityFilters;
  period: { start: string; end: string };
}) {
  const pipelineOptions = new Map<string, { label: string; count: number }>();
  const responsibleOptions = new Map<string, { label: string; count: number }>();
  const sourceOptions = new Map<string, { label: string; count: number }>();
  const stageOptions = new Map<string, { label: string; count: number }>();
  const positionOptions = new Map<string, { label: string; count: number }>();
  const productOptions = new Map<string, { label: string; count: number }>();

  const base = input.rows.flatMap(row => {
    const raw = parsePayload(row.rawPayload);
    if (cleanText(raw.TITLE, "") !== RD_OPPORTUNITY_LEAD_TITLE) return [];
    if (cleanText(raw.SOURCE_ID, "") === BITRIX_EVENT_SOURCE_ID) return [];
    const pipelineId = cleanText(raw.UF_CRM_1739195085, "unknown");
    const pipelineLabel = PIPELINE_LABELS[pipelineId] ?? (pipelineId === "unknown" ? "Não identificado" : `Pipeline #${pipelineId}`);
    const responsibleId = cleanText(raw.ASSIGNED_BY_ID, "unknown");
    const responsibleLabel = RESPONSIBLE_LABELS[responsibleId] ?? (responsibleId === "unknown" ? "Não identificado" : `Responsável #${responsibleId}`);
    const sourceLabel = safeSourceDescription(raw.SOURCE_DESCRIPTION);
    const stageId = cleanText(raw.STATUS_ID ?? row.stageOrStatus, "unknown");
    const stageLabel = STATUS_LABELS[stageId] ?? (stageId === "unknown" ? "Não identificado" : `Etapa #${stageId}`);
    const positionLabel = cleanText(raw.POST);
    const productLabel = cleanText(raw.UF_CRM_1738950946);
    const item = { row, raw, pipelineId, pipelineLabel, responsibleId, responsibleLabel, sourceLabel, stageId, stageLabel, positionLabel, productLabel };
    for (const [map, value, label] of [
      [pipelineOptions, pipelineId, pipelineLabel], [responsibleOptions, responsibleId, responsibleLabel], [sourceOptions, sourceLabel, sourceLabel],
      [stageOptions, stageId, stageLabel], [positionOptions, positionLabel, positionLabel], [productOptions, productLabel, productLabel],
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
    && (input.filters.source === "all" || item.sourceLabel === input.filters.source)
    && (input.filters.stage === "all" || item.stageId === input.filters.stage)
    && (input.filters.position === "all" || item.positionLabel === input.filters.position)
    && (input.filters.product === "all" || item.productLabel === input.filters.product)
  );

  const byDay = new Map<string, number>();
  const responsible = new Map<string, number>();
  const sourceInformation = new Map<string, number>();
  const stages = new Map<string, number>();
  const positions = new Map<string, number>();
  const products = new Map<string, number>();
  const coverage = { sourceInformation: 0, position: 0, product: 0, responsibleName: 0 };

  for (const item of eligible) {
    addCount(byDay, dayKey(item.row.createdAtBitrix));
    addCount(responsible, item.responsibleLabel);
    addCount(sourceInformation, item.sourceLabel);
    addCount(stages, item.stageLabel);
    addCount(positions, item.positionLabel);
    addCount(products, item.productLabel);
    if (RESPONSIBLE_LABELS[item.responsibleId]) coverage.responsibleName += 1;
    if (item.sourceLabel !== "Não informado") coverage.sourceInformation += 1;
    if (item.positionLabel !== "Não informado") coverage.position += 1;
    if (item.productLabel !== "Não informado") coverage.product += 1;
  }

  const eligibleByLeadId = new Map(eligible.map(item => [String(item.row.bitrixId), item]));
  const wonByDay = new Map<string, number>();
  const wonByOrigin = new Map<string, number>();
  const linkedWonByDay = new Map<string, number>();
  const linkedWonByOrigin = new Map<string, number>();
  let wonInDateRange = 0;
  let wonValueInDateRange = 0;
  let linkedWon = 0;
  let linkedWonValue = 0;
  const startMs = new Date(`${input.period.start}T00:00:00-03:00`).getTime();
  const endExclusive = new Date(`${input.period.end}T00:00:00-03:00`);
  endExclusive.setDate(endExclusive.getDate() + 1);

  for (const dealRow of input.dealRows ?? []) {
    const deal = parsePayload(dealRow.rawPayload);
    if (cleanText(deal.STAGE_SEMANTIC_ID, "") !== "S") continue;
    const closeDate = dateFromPayload(deal.CLOSEDATE);
    if (!closeDate || closeDate.getTime() < startMs || closeDate.getTime() >= endExclusive.getTime()) continue;
    const value = numberValue(deal.OPPORTUNITY);
    wonInDateRange += 1;
    wonValueInDateRange += value;
    addCount(wonByDay, dayKey(closeDate));
    const dealSource = safeSourceDescription(deal.SOURCE_DESCRIPTION);
    const directOrigin = dealSource !== "Não informado" ? dealSource : cleanText(deal.UTM_SOURCE ?? deal.SOURCE_ID);
    addCount(wonByOrigin, directOrigin);
    const lead = eligibleByLeadId.get(cleanText(deal.LEAD_ID, ""));
    if (!lead) continue;
    linkedWon += 1;
    linkedWonValue += value;
    addCount(linkedWonByDay, dayKey(closeDate));
    const origin = dealSource !== "Não informado" ? dealSource : cleanText(deal.UTM_SOURCE, lead.sourceLabel);
    addCount(linkedWonByOrigin, origin);
  }

  const daily = countRows(byDay).sort((a, b) => a.label.localeCompare(b.label)).map(item => ({ date: item.label, count: item.count }));
  const activeDays = daily.filter(item => item.count > 0).length;
  const peakDay = [...daily].sort((a, b) => b.count - a.count || a.date.localeCompare(b.date))[0] ?? null;
  return {
    titleFilter: RD_OPPORTUNITY_LEAD_TITLE,
    eventSourceExcluded: true,
    period: input.period,
    selectedFilters: input.filters,
    filterOptions: {
      pipelines: optionRows(pipelineOptions), responsibles: optionRows(responsibleOptions), sources: optionRows(sourceOptions), stages: optionRows(stageOptions), positions: optionRows(positionOptions), products: optionRows(productOptions),
    },
    totals: { leads: eligible.length, activeDays, averagePerActiveDay: activeDays ? eligible.length / activeDays : 0, peakDay, distinctResponsibles: responsible.size },
    coverage,
    byDay: daily,
    pipelines: countRows(new Map(optionRows(pipelineOptions).map(item => [item.label, item.count]))),
    responsible: countRows(responsible),
    sourceInformation: countRows(sourceInformation),
    stages: countRows(stages),
    positions: countRows(positions),
    products: countRows(products),
    wonDeals: {
      totalInDateRange: wonInDateRange,
      valueInDateRange: wonValueInDateRange,
      linkedToFilteredLeads: linkedWon,
      linkedValue: linkedWonValue,
      outsideCurrentLeadFilter: wonInDateRange - linkedWon,
      linkCoverage: wonInDateRange ? (linkedWon / wonInDateRange) * 100 : 0,
      byCloseDay: countRows(wonByDay).sort((a, b) => a.label.localeCompare(b.label)).map(item => ({ date: item.label, count: item.count })),
      byOrigin: countRows(wonByOrigin),
      linkedByCloseDay: countRows(linkedWonByDay).sort((a, b) => a.label.localeCompare(b.label)).map(item => ({ date: item.label, count: item.count })),
      linkedByOrigin: countRows(linkedWonByOrigin),
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
  const [rows, dealRows] = await Promise.all([
    db.select({ bitrixId: bitrix24Entities.bitrixId, createdAtBitrix: bitrix24Entities.createdAtBitrix, stageOrStatus: bitrix24Entities.stageOrStatus, rawPayload: bitrix24Entities.rawPayload })
      .from(bitrix24Entities).where(and(eq(bitrix24Entities.portal, input.portal), eq(bitrix24Entities.entityType, "lead"), eq(bitrix24Entities.title, RD_OPPORTUNITY_LEAD_TITLE), gte(bitrix24Entities.createdAtBitrix, input.start), lt(bitrix24Entities.createdAtBitrix, input.end))),
    db.select({ rawPayload: bitrix24Entities.rawPayload }).from(bitrix24Entities)
      .where(and(eq(bitrix24Entities.portal, input.portal), eq(bitrix24Entities.entityType, "deal"))),
  ]);
  return buildRdOpportunityManagerDashboard({ rows, dealRows, filters: input.filters, period: { start: input.startDate, end: input.endDate } });
}
