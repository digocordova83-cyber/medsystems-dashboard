import { describe, expect, it } from "vitest";
import { buildRdOpportunityManagerDashboard, rdOpportunityCandidateRows, validateBusinessDateRange } from "./rdOpportunityAnalytics";

const filters = {
  pipeline: "all",
  responsible: "all",
  source: "all",
  stage: "all",
  position: "all",
  product: "all",
  campaign: "all",
  adset: "all",
  creative: "all",
};
const rd = { UF_CRM_1738950899: "1" };
const row = (bitrixId: number, payload: Record<string, unknown>, day = "2026-09-03T12:00:00-03:00") => ({
  bitrixId,
  createdAtBitrix: new Date(day),
  stageOrStatus: String(payload.STATUS_ID ?? "NEW"),
  rawPayload: JSON.stringify(payload),
});
const deal = (payload: Record<string, unknown>) => ({ rawPayload: JSON.stringify(payload) });

describe("buildRdOpportunityManagerDashboard", () => {
  const rows = [
    row(1, { ...rd, TITLE: "Lead A", UF_CRM_1739195085: "15391", ASSIGNED_BY_ID: "5521", STATUS_ID: "NEW", UTM_SOURCE: "google", UTM_MEDIUM: "cpc", UTM_CAMPAIGN: "med-search", UTM_TERM: "grupo-a", UTM_CONTENT: "criativo-a", POST: "Sócio", UF_CRM_1738950946: "Ultraformer" }),
    row(2, { ...rd, TITLE: "Lead B", UF_CRM_1739195085: "15395", ASSIGNED_BY_ID: "38111", STATUS_ID: "IN_PROCESS", UTM_SOURCE: "meta", UTM_MEDIUM: "paid_social", UTM_CAMPAIGN: "beauty-leads", UTM_TERM: "publico-b", UTM_CONTENT: "video-b" }, "2026-09-04T12:00:00-03:00"),
    row(3, { ...rd, TITLE: "Lead C", UF_CRM_1739195085: "15391", STATUS_ID: "UC_HZQN9I", UTM_SOURCE: "google", UTM_CAMPAIGN: "med-search" }),
    row(4, { TITLE: "Sem flag", UF_CRM_1739195085: "15391", STATUS_ID: "CONVERTED" }),
  ];

  it("usa exclusivamente RD Station = sim e preserva uma unidade por ID técnico", () => {
    const result = buildRdOpportunityManagerDashboard({ rows, filters, period: { start: "2026-09-01", end: "2026-09-08" } });
    expect(result.totals).toMatchObject({ leads: 3, uniqueBitrixLeadIds: 3, uniqueContacts: 3 });
    expect(result.sourceRule).toContain("RD Station = sim");
    expect(result.filterOptions.pipelines).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: "15391", count: 2 }),
      expect.objectContaining({ value: "15395", count: 1 }),
    ]));
  });

  it("calcula MQL e SQL pelo status atual e negócios ganhos de forma independente", () => {
    const result = buildRdOpportunityManagerDashboard({
      rows,
      dealRows: [
        deal({ ID: "101", CATEGORY_ID: "42", STAGE_SEMANTIC_ID: "S", OPPORTUNITY: "9000" }),
        deal({ ID: "102", CATEGORY_ID: "57", STAGE_SEMANTIC_ID: "S", OPPORTUNITY: "15000" }),
        deal({ ID: "103", CATEGORY_ID: "44", STAGE_SEMANTIC_ID: "S", OPPORTUNITY: "30000" }),
      ],
      filters,
      period: { start: "2026-09-01", end: "2026-09-08" },
    });
    expect(result.totals).toMatchObject({ leads: 3, mql: 2, sql: 1, wonDeals: 2, totalDealValue: 24000, wonValue: 24000 });
    expect(result.funnel.map(stage => stage.count)).toEqual([3, 2, 1]);
    expect(result.commercialWinsByBu).toEqual({
      medsystems: { count: 1, value: 9000 },
      beautysystems: { count: 1, value: 15000 },
    });
  });

  it("aplica BU somente pelo pipeline e mantém filtros de dimensão", () => {
    const result = buildRdOpportunityManagerDashboard({
      rows,
      filters: { ...filters, pipeline: "15395", source: "meta", campaign: "beauty-leads", adset: "video-b", creative: "publico-b" },
      period: { start: "2026-09-01", end: "2026-09-08" },
    });
    expect(result.totals.leads).toBe(1);
    expect(result.campaigns).toEqual([{ label: "beauty-leads", count: 1 }]);
  });

  it("mantém leads sem pipeline na categoria não atribuída", () => {
    const result = buildRdOpportunityManagerDashboard({
      rows: [row(5, { ...rd, STATUS_ID: "NEW" })],
      filters,
      period: { start: "2026-09-01", end: "2026-09-08" },
    });
    expect(result.totals).toMatchObject({ leads: 1, unassignedLeads: 1 });
    expect(result.filterOptions.pipelines).toEqual([expect.objectContaining({ value: "unknown", label: "Não identificado", count: 1 })]);
  });

  it("usa o payload RD embutido como fallback quando as UTMs diretas estão vazias", () => {
    const embedded = JSON.stringify({ last_conversion: { content: { traffic_source: "utm_source=Facebook%20Ads&utm_medium=cpc&utm_campaign=campanha-x&utm_term=conjunto-x&utm_content=criativo-x" }, conversion_origin: { source: "Facebook Ads", medium: "cpc", campaign: "campanha-x" } } });
    const result = buildRdOpportunityManagerDashboard({
      rows: [row(6, { ...rd, STATUS_ID: "NEW", UTM_SOURCE: "undefined", UTM_MEDIUM: "undefined", UF_CRM_1778601092663: embedded })],
      filters,
      period: { start: "2026-09-01", end: "2026-09-08" },
    });
    expect(result.attribution[0]).toMatchObject({ source: "Facebook Ads", medium: "cpc", campaign: "campanha-x", adset: "criativo-x", creative: "conjunto-x" });
  });

  it("mantém valores ausentes como Não identificado", () => {
    const result = buildRdOpportunityManagerDashboard({
      rows: [row(7, { ...rd, STATUS_ID: "NEW", UTM_SOURCE: "undefined" })],
      filters,
      period: { start: "2026-09-01", end: "2026-09-08" },
    });
    expect(result.attribution[0].source).toBe("Não identificado");
    expect(result.coverage.source).toBe(0);
  });

  it("não deduplica dois IDs técnicos mesmo quando os campos de contato coincidem", () => {
    const result = buildRdOpportunityManagerDashboard({
      rows: [
        { ...row(71, { ...rd, UF_CRM_1739195085: "15391", STATUS_ID: "NEW" }), email: "mesmo@teste.com" },
        { ...row(72, { ...rd, UF_CRM_1739195085: "15391", STATUS_ID: "IN_PROCESS" }), email: "mesmo@teste.com" },
      ],
      filters,
      period: { start: "2026-09-01", end: "2026-09-08" },
    });
    expect(result.totals).toMatchObject({ leads: 2, uniqueBitrixLeadIds: 2 });
    expect(result.duplicates).toMatchObject({ peopleWithMultipleLeadIds: 0, leadIdsInDuplicateGroups: 0, extraLeadIds: 0 });
  });

  it("pré-seleciona somente leads com o campo oficial RD Station = sim", () => {
    const candidates = rdOpportunityCandidateRows({
      rows: [
        row(81, { ...rd, UF_CRM_1739195085: "15391" }),
        row(82, { UF_CRM_1739195085: "15391" }),
        row(83, { ...rd, UF_CRM_1739195085: "20889" }),
      ],
    });
    expect(candidates.map(candidate => candidate.bitrixId)).toEqual([81, 83]);
  });

  it("valida o intervalo configurável no fuso de São Paulo", () => {
    expect(validateBusinessDateRange("2026-09-01", "2026-09-08").endExclusive.toISOString()).toBe("2026-09-09T03:00:00.000Z");
    expect(() => validateBusinessDateRange("2026-09-08", "2026-09-01")).toThrow("data inicial");
  });
});
