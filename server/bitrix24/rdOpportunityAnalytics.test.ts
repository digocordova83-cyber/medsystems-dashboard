import { describe, expect, it } from "vitest";
import { buildRdOpportunityManagerDashboard, validateBusinessDateRange } from "./rdOpportunityAnalytics";

const filters = { pipeline: "all", responsible: "all", source: "all", stage: "all", position: "all", product: "all" };
const row = (bitrixId: number, payload: Record<string, unknown>, day = "2026-08-03T12:00:00-03:00") => ({ bitrixId, createdAtBitrix: new Date(day), stageOrStatus: String(payload.STATUS_ID ?? "NEW"), rawPayload: JSON.stringify(payload) });
const deal = (payload: Record<string, unknown>) => ({ rawPayload: JSON.stringify(payload) });

describe("buildRdOpportunityManagerDashboard", () => {
  const rows = [
    row(1, { TITLE: "Oportunidade do RD Station", SOURCE_ID: "70", UF_CRM_1739195085: "15391", ASSIGNED_BY_ID: "5521", SOURCE_DESCRIPTION: "Landing page", STATUS_ID: "NEW", POST: "Sócio", UF_CRM_1738950946: "Ultraformer" }),
    row(2, { TITLE: "Oportunidade do RD Station", SOURCE_ID: "70", UF_CRM_1739195085: "15395", ASSIGNED_BY_ID: "38111", SOURCE_DESCRIPTION: "Facebook", STATUS_ID: "IN_PROCESS" }, "2026-08-04T12:00:00-03:00"),
    row(3, { TITLE: "Oportunidade do RD Station", SOURCE_ID: "UC_45K0VX", UF_CRM_1739195085: "15391", ASSIGNED_BY_ID: "5521", STATUS_ID: "NEW" }),
    row(4, { TITLE: "Outro nome", SOURCE_ID: "70", UF_CRM_1739195085: "15391", ASSIGNED_BY_ID: "5521", STATUS_ID: "NEW" }),
  ];

  it("mantém somente o título exato e exclui a origem estruturada Evento", () => {
    const result = buildRdOpportunityManagerDashboard({ rows, filters, period: { start: "2026-08-01", end: "2026-08-19" } });
    expect(result.totals.leads).toBe(2);
    expect(result.filterOptions.pipelines).toEqual(expect.arrayContaining([expect.objectContaining({ value: "15391", count: 1 }), expect.objectContaining({ value: "15395", count: 1 })]));
  });

  it("cruza pipeline, responsável e origem em todas as distribuições", () => {
    const result = buildRdOpportunityManagerDashboard({ rows, filters: { ...filters, pipeline: "15391", responsible: "5521", source: "Landing page" }, period: { start: "2026-08-01", end: "2026-08-19" } });
    expect(result.totals.leads).toBe(1);
    expect(result.stages).toEqual([{ label: "SDR", count: 1 }]);
    expect(result.products).toEqual([{ label: "Ultraformer", count: 1 }]);
  });

  it("normaliza marcadores vazios sem tratá-los como dados preenchidos", () => {
    const result = buildRdOpportunityManagerDashboard({ rows: [row(1, { TITLE: "Oportunidade do RD Station", SOURCE_ID: "70", UF_CRM_1739195085: "15391", ASSIGNED_BY_ID: "5521", STATUS_ID: "NEW", POST: "undefined", UF_CRM_1738950946: "null" })], filters, period: { start: "2026-08-01", end: "2026-08-19" } });
    expect(result.positions).toEqual([{ label: "Não informado", count: 1 }]);
    expect(result.coverage.position).toBe(0);
  });

  it("conta ganhos por CLOSEDATE, mostra a origem do negócio e separa o vínculo por LEAD_ID", () => {
    const result = buildRdOpportunityManagerDashboard({
      rows,
      dealRows: [
        deal({ STAGE_SEMANTIC_ID: "S", CLOSEDATE: "2026-08-10T12:00:00-03:00", LEAD_ID: "1", OPPORTUNITY: "15000", SOURCE_DESCRIPTION: "Indicação" }),
        deal({ STAGE_SEMANTIC_ID: "S", CLOSEDATE: "2026-08-11T12:00:00-03:00", LEAD_ID: null, OPPORTUNITY: "9000" }),
      ],
      filters: { ...filters, pipeline: "15391" },
      period: { start: "2026-08-01", end: "2026-08-19" },
    });
    expect(result.wonDeals.totalInDateRange).toBe(2);
    expect(result.wonDeals.linkedToFilteredLeads).toBe(1);
    expect(result.wonDeals.linkedValue).toBe(15000);
    expect(result.wonDeals.byOrigin).toEqual([{ label: "Indicação", count: 1 }, { label: "Não informado", count: 1 }]);
    expect(result.wonDeals.byCloseDay).toHaveLength(2);
    expect(result.wonDeals.linkedByOrigin).toEqual([{ label: "Indicação", count: 1 }]);
  });

  it("valida o intervalo configurável", () => {
    expect(validateBusinessDateRange("2026-08-01", "2026-08-19").endExclusive.toISOString()).toBe("2026-08-20T03:00:00.000Z");
    expect(() => validateBusinessDateRange("2026-08-20", "2026-08-01")).toThrow("data inicial");
  });
});
