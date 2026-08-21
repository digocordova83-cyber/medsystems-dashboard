import { and, eq, gte, lt } from "drizzle-orm";
import { bitrix24Entities } from "../../drizzle/schema";
import { getDb } from "../db";

export const RD_OPPORTUNITY_LEAD_TITLE = "Oportunidade do RD Station";
export const BITRIX_EVENT_SOURCE_ID = "UC_45K0VX";

const PIPELINE_LABELS: Record<string, string> = {
  "15389": "Advance",
  "15391": "Medsystems",
  "15393": "Reface",
  "15395": "Negócios e Redes",
  "15397": "Canfield",
  "15399": "Aeskins",
  "15401": "Venda Recorrente - WF5",
  "17287": "Aeskins Venda Recorrente",
  "17307": "Medacademy",
  "17309": "Demonstração",
  "18811": "Franquias",
  "20889": "Consumíveis",
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

const RESPONSIBLE_LABELS: Record<string, string> = {
  "5521": "Vitor da Silva",
  "13877": "Marcela Assis Satilho Muller",
  "25441": "Maria Julia Pazinatto Rodrigues",
  "38111": "Eduardo Santos Franca",
  "56793": "Yasmin De Souza Freitas",
};

export type RdOpportunityPipeline = "all" | string;
export type RdOpportunityRawLead = {
  createdAtBitrix: Date;
  stageOrStatus: string | null;
  rawPayload: string;
};

type CountRow = { label: string; count: number };

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

function addCount(map: Map<string, number>, label: string) {
  map.set(label, (map.get(label) ?? 0) + 1);
}

function countRows(map: Map<string, number>): CountRow[] {
  return Array.from(map, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function dayKey(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export function buildRdOpportunityManagerDashboard(input: {
  rows: RdOpportunityRawLead[];
  pipeline: RdOpportunityPipeline;
  period: { key: "2026-07" | "2026-08"; start: string; end: string };
}) {
  const pipelineCounts = new Map<string, number>();
  const eligible = input.rows.flatMap(row => {
    const raw = parsePayload(row.rawPayload);
    if (cleanText(raw.TITLE, "") !== RD_OPPORTUNITY_LEAD_TITLE) return [];
    if (cleanText(raw.SOURCE_ID, "") === BITRIX_EVENT_SOURCE_ID) return [];
    const pipelineId = cleanText(raw.UF_CRM_1739195085, "unknown");
    const pipelineLabel = PIPELINE_LABELS[pipelineId] ?? (pipelineId === "unknown" ? "Não identificado" : `Pipeline #${pipelineId}`);
    addCount(pipelineCounts, pipelineLabel);
    if (input.pipeline !== "all" && pipelineId !== input.pipeline) return [];
    return [{ row, raw, pipelineId, pipelineLabel }];
  });

  const byDay = new Map<string, number>();
  const responsible = new Map<string, number>();
  const sourceInformation = new Map<string, number>();
  const stages = new Map<string, number>();
  const positions = new Map<string, number>();
  const products = new Map<string, number>();
  const coverage = { sourceInformation: 0, position: 0, product: 0, responsibleName: 0 };

  for (const item of eligible) {
    addCount(byDay, dayKey(item.row.createdAtBitrix));
    const responsibleId = cleanText(item.raw.ASSIGNED_BY_ID, "unknown");
    const responsibleLabel = RESPONSIBLE_LABELS[responsibleId] ?? (responsibleId === "unknown" ? "Não identificado" : `Responsável #${responsibleId}`);
    addCount(responsible, responsibleLabel);
    if (RESPONSIBLE_LABELS[responsibleId]) coverage.responsibleName += 1;

    const source = safeSourceDescription(item.raw.SOURCE_DESCRIPTION);
    addCount(sourceInformation, source);
    if (source !== "Não informado") coverage.sourceInformation += 1;

    const statusId = cleanText(item.raw.STATUS_ID ?? item.row.stageOrStatus, "unknown");
    addCount(stages, STATUS_LABELS[statusId] ?? (statusId === "unknown" ? "Não identificado" : `Etapa #${statusId}`));

    const position = cleanText(item.raw.POST);
    addCount(positions, position);
    if (position !== "Não informado") coverage.position += 1;

    const product = cleanText(item.raw.UF_CRM_1738950946);
    addCount(products, product);
    if (product !== "Não informado") coverage.product += 1;
  }

  const daily = countRows(byDay).sort((a, b) => a.label.localeCompare(b.label)).map(item => ({ date: item.label, count: item.count }));
  const activeDays = daily.filter(item => item.count > 0).length;
  const peakDay = [...daily].sort((a, b) => b.count - a.count || a.date.localeCompare(b.date))[0] ?? null;
  const selectedPipeline = input.pipeline === "all"
    ? { id: "all", label: "Todos os pipelines" }
    : { id: input.pipeline, label: PIPELINE_LABELS[input.pipeline] ?? `Pipeline #${input.pipeline}` };
  const pipelineOptions = Array.from(pipelineCounts, ([label, count]) => {
    const id = Object.entries(PIPELINE_LABELS).find(([, candidate]) => candidate === label)?.[0] ?? "unknown";
    return { id, label, count };
  }).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    titleFilter: RD_OPPORTUNITY_LEAD_TITLE,
    eventSourceExcluded: true,
    period: input.period,
    selectedPipeline,
    pipelineOptions,
    totals: {
      leads: eligible.length,
      activeDays,
      averagePerActiveDay: activeDays ? eligible.length / activeDays : 0,
      peakDay,
      distinctResponsibles: responsible.size,
    },
    coverage,
    byDay: daily,
    pipelines: countRows(pipelineCounts),
    responsible: countRows(responsible),
    sourceInformation: countRows(sourceInformation),
    stages: countRows(stages),
    positions: countRows(positions),
    products: countRows(products),
  };
}

export async function rdOpportunityManagerDashboard(input: {
  portal: string;
  start: Date;
  end: Date;
  period: "2026-07" | "2026-08";
  pipeline: RdOpportunityPipeline;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const rows = await db.select({
    createdAtBitrix: bitrix24Entities.createdAtBitrix,
    stageOrStatus: bitrix24Entities.stageOrStatus,
    rawPayload: bitrix24Entities.rawPayload,
  }).from(bitrix24Entities).where(and(
    eq(bitrix24Entities.portal, input.portal),
    eq(bitrix24Entities.entityType, "lead"),
    eq(bitrix24Entities.title, RD_OPPORTUNITY_LEAD_TITLE),
    gte(bitrix24Entities.createdAtBitrix, input.start),
    lt(bitrix24Entities.createdAtBitrix, input.end),
  ));
  return buildRdOpportunityManagerDashboard({
    rows,
    pipeline: input.pipeline,
    period: {
      key: input.period,
      start: input.period === "2026-08" ? "2026-08-01" : "2026-07-01",
      end: input.period === "2026-08" ? "2026-08-19" : "2026-07-31",
    },
  });
}
