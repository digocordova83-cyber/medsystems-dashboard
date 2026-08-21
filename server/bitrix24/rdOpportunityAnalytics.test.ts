import { describe, expect, it } from "vitest";
import { buildRdOpportunityManagerDashboard } from "./rdOpportunityAnalytics";

const row = (payload: Record<string, unknown>, day = "2026-08-03T12:00:00-03:00") => ({
  createdAtBitrix: new Date(day),
  stageOrStatus: String(payload.STATUS_ID ?? "NEW"),
  rawPayload: JSON.stringify(payload),
});

describe("buildRdOpportunityManagerDashboard", () => {
  const rows = [
    row({ TITLE: "Oportunidade do RD Station", SOURCE_ID: "70", UF_CRM_1739195085: "15391", ASSIGNED_BY_ID: "5521", SOURCE_DESCRIPTION: "Landing page", STATUS_ID: "NEW", POST: "Sócio", UF_CRM_1738950946: "Ultraformer" }),
    row({ TITLE: "Oportunidade do RD Station", SOURCE_ID: "70", UF_CRM_1739195085: "15395", ASSIGNED_BY_ID: "38111", STATUS_ID: "IN_PROCESS" }, "2026-08-04T12:00:00-03:00"),
    row({ TITLE: "Oportunidade do RD Station", SOURCE_ID: "UC_45K0VX", UF_CRM_1739195085: "15391", ASSIGNED_BY_ID: "5521", STATUS_ID: "NEW" }),
    row({ TITLE: "Outro nome", SOURCE_ID: "70", UF_CRM_1739195085: "15391", ASSIGNED_BY_ID: "5521", STATUS_ID: "NEW" }),
  ];

  it("mantém somente o título exato e exclui a origem estruturada Evento", () => {
    const result = buildRdOpportunityManagerDashboard({ rows, pipeline: "all", period: { key: "2026-08", start: "2026-08-01", end: "2026-08-19" } });
    expect(result.totals.leads).toBe(2);
    expect(result.pipelineOptions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "15391", count: 1 }),
      expect.objectContaining({ id: "15395", count: 1 }),
    ]));
    expect(result.responsible[0]).toEqual(expect.objectContaining({ count: 1 }));
  });

  it("aplica o filtro de Pipeline de Vendas a todas as distribuições", () => {
    const result = buildRdOpportunityManagerDashboard({ rows, pipeline: "15391", period: { key: "2026-08", start: "2026-08-01", end: "2026-08-19" } });
    expect(result.totals.leads).toBe(1);
    expect(result.selectedPipeline.label).toBe("Medsystems");
    expect(result.stages).toEqual([{ label: "SDR", count: 1 }]);
    expect(result.products).toEqual([{ label: "Ultraformer", count: 1 }]);
  });

  it("normaliza marcadores vazios sem tratá-los como dados preenchidos", () => {
    const result = buildRdOpportunityManagerDashboard({
      rows: [row({ TITLE: "Oportunidade do RD Station", SOURCE_ID: "70", UF_CRM_1739195085: "15391", ASSIGNED_BY_ID: "5521", STATUS_ID: "NEW", POST: "undefined", UF_CRM_1738950946: "null" })],
      pipeline: "all",
      period: { key: "2026-08", start: "2026-08-01", end: "2026-08-19" },
    });
    expect(result.positions).toEqual([{ label: "Não informado", count: 1 }]);
    expect(result.products).toEqual([{ label: "Não informado", count: 1 }]);
    expect(result.coverage.position).toBe(0);
    expect(result.coverage.product).toBe(0);
  });
});
