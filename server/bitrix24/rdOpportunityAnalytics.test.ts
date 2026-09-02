import { describe, expect, it } from "vitest";
import { buildRdOpportunityManagerDashboard, validateBusinessDateRange } from "./rdOpportunityAnalytics";

const filters = {
  pipeline: "all", responsible: "all", source: "all", stage: "all", position: "all", product: "all",
  campaign: "all", adset: "all", creative: "all",
};
const paid = { UF_CRM_1744808620: "Tráfego Pago" };
const row = (bitrixId: number, payload: Record<string, unknown>, day = "2026-08-03T12:00:00-03:00") => ({ bitrixId, createdAtBitrix: new Date(day), stageOrStatus: String(payload.STATUS_ID ?? "NEW"), rawPayload: JSON.stringify(payload) });
const deal = (payload: Record<string, unknown>) => ({ rawPayload: JSON.stringify(payload) });

describe("buildRdOpportunityManagerDashboard", () => {
  const rows = [
    row(1, { ...paid, TITLE: "Lead A", rd_contact_uuid: "rd-a", UF_CRM_1739195085: "15391", ASSIGNED_BY_ID: "5521", STATUS_ID: "NEW", UTM_SOURCE: "google", UTM_MEDIUM: "cpc", UTM_CAMPAIGN: "med-search", UTM_TERM: "grupo-a", UTM_CONTENT: "criativo-a", POST: "Sócio", UF_CRM_1738950946: "Ultraformer" }),
    row(2, { ...paid, TITLE: "Lead B", rd_contact_uuid: "rd-b", UF_CRM_1739195085: "15395", ASSIGNED_BY_ID: "38111", STATUS_ID: "IN_PROCESS", UTM_SOURCE: "meta", UTM_MEDIUM: "paid_social", UTM_CAMPAIGN: "beauty-leads", UTM_TERM: "publico-b", UTM_CONTENT: "video-b" }, "2026-08-04T12:00:00-03:00"),
    row(3, { ...paid, TITLE: "Lead C", rd_contact_uuid: "rd-c", UF_CRM_1739195085: "15391", STATUS_ID: "UC_HZQN9I", UTM_SOURCE: "google", UTM_CAMPAIGN: "med-search" }),
    row(4, { TITLE: "Lead orgânico", UF_CRM_1744808620: "Orgânico", STATUS_ID: "CONVERTED" }),
  ];
  const referenceRows = [
    { accountKey: "medsystems" as const, identityHash: "identity-a", rdContactUuid: "rd-a" },
    { accountKey: "beautysystems" as const, identityHash: "identity-b", rdContactUuid: "rd-b" },
    { accountKey: "medsystems" as const, identityHash: "identity-c", rdContactUuid: "rd-c" },
  ];

  it("usa a referência de origem como universo e não depende do título ou do campo pago", () => {
    const result = buildRdOpportunityManagerDashboard({ rows, referenceRows, filters, period: { start: "2026-08-01", end: "2026-08-25" } });
    expect(result.totals.leads).toBe(3);
    expect(result.sourceRule).toContain("fonte conciliada");
    expect(result.filterOptions.pipelines).toEqual(expect.arrayContaining([expect.objectContaining({ value: "15391", count: 2 }), expect.objectContaining({ value: "15395", count: 1 })]));
  });

  it("calcula MQL, SQL, negócios, ganhos e valores com vínculo auditável", () => {
    const result = buildRdOpportunityManagerDashboard({
      rows,
      referenceRows,
      dealRows: [
        deal({ ID: "101", LEAD_ID: "1", STAGE_SEMANTIC_ID: "P", OPPORTUNITY: "9000" }),
        deal({ ID: "102", LEAD_ID: "3", STAGE_SEMANTIC_ID: "S", OPPORTUNITY: "15000" }),
      ],
      filters,
      period: { start: "2026-08-01", end: "2026-08-25" },
    });
    expect(result.totals).toMatchObject({ leads: 3, mql: 3, sql: 2, dealLeads: 2, dealCount: 2, wonDeals: 1, totalDealValue: 24000, wonValue: 15000 });
    expect(result.funnel.map(stage => stage.count)).toEqual([3, 3, 2, 2, 1]);
  });

  it("cruza filtros de pipeline, campanha, conjunto e criativo", () => {
    const result = buildRdOpportunityManagerDashboard({ rows, referenceRows, filters: { ...filters, pipeline: "15395", source: "meta", campaign: "beauty-leads", adset: "video-b", creative: "publico-b" }, period: { start: "2026-08-01", end: "2026-08-25" } });
    expect(result.totals.leads).toBe(1);
    expect(result.campaigns).toEqual([{ label: "beauty-leads", count: 1 }]);
  });

  it("usa o payload RD embutido como fallback quando as UTMs diretas estão vazias", () => {
    const embedded = JSON.stringify({ last_conversion: { content: { traffic_source: "utm_source=Facebook%20Ads&utm_medium=cpc&utm_campaign=campanha-x&utm_term=conjunto-x&utm_content=criativo-x" }, conversion_origin: { source: "Facebook Ads", medium: "cpc", campaign: "campanha-x" } } });
    const result = buildRdOpportunityManagerDashboard({ rows: [row(5, { ...paid, rd_contact_uuid: "rd-embedded", STATUS_ID: "NEW", UTM_SOURCE: "undefined", UTM_MEDIUM: "undefined", UF_CRM_1778601092663: embedded })], referenceRows: [{ accountKey: "medsystems", identityHash: "embedded", rdContactUuid: "rd-embedded" }], filters, period: { start: "2026-08-01", end: "2026-08-25" } });
    expect(result.attribution[0]).toMatchObject({ source: "Facebook Ads", medium: "cpc", campaign: "campanha-x", adset: "criativo-x", creative: "conjunto-x" });
  });

  it("mantém valores ausentes como Não identificado", () => {
    const result = buildRdOpportunityManagerDashboard({ rows: [row(6, { ...paid, rd_contact_uuid: "rd-missing", STATUS_ID: "NEW", UTM_SOURCE: "undefined" })], referenceRows: [{ accountKey: "medsystems", identityHash: "missing", rdContactUuid: "rd-missing" }], filters, period: { start: "2026-08-01", end: "2026-08-25" } });
    expect(result.attribution[0].source).toBe("Não identificado");
    expect(result.coverage.source).toBe(0);
  });

  it("inclui no CRM um lead fora de Tráfego Pago quando há match inequívoco e aplica a BU da referência", () => {
    const matched = row(7, { UF_CRM_1744808620: "Tráfego Orgânico", UF_CRM_1739195085: "15395", STATUS_ID: "IN_PROCESS", rd_contact_uuid: "rd-med-001" });
    const result = buildRdOpportunityManagerDashboard({
      rows: [matched],
      referenceRows: [{ accountKey: "medsystems", identityHash: "hash", rdContactUuid: "rd-med-001" }],
      filters,
      period: { start: "2026-08-01", end: "2026-08-25" },
    });
    expect(result.totals).toMatchObject({ leads: 1, reconciledByIdentity: 1, reconciledOutsidePaidField: 1 });
    expect(result.filterOptions.pipelines).toEqual([expect.objectContaining({ value: "15391", count: 1 })]);
  });

  it("conta a pessoa uma vez e separa os múltiplos IDs Bitrix24 como duplicidade", () => {
    const referenceRows = [{ accountKey: "medsystems" as const, identityHash: "identity-a", rdContactUuid: "rd-med-dup" }];
    const result = buildRdOpportunityManagerDashboard({
      rows: [
        row(71, { ...paid, UF_CRM_1739195085: "15391", STATUS_ID: "NEW", rd_contact_uuid: "rd-med-dup", UTM_CAMPAIGN: "campanha-dup" }),
        row(72, { ...paid, UF_CRM_1739195085: "15391", STATUS_ID: "IN_PROCESS", rd_contact_uuid: "rd-med-dup", UTM_CAMPAIGN: "campanha-dup" }),
      ],
      referenceRows,
      filters,
      period: { start: "2026-08-01", end: "2026-08-25" },
    });
    expect(result.totals).toMatchObject({ leads: 1, uniqueContacts: 1, uniqueBitrixLeadIds: 2 });
    expect(result.funnel[0]).toMatchObject({ count: 1 });
    expect(result.duplicates).toMatchObject({ peopleWithMultipleLeadIds: 1, leadIdsInDuplicateGroups: 2, extraLeadIds: 1 });
    expect(result.duplicates.byBrand).toEqual([{ label: "Medsystems", count: 1 }]);
  });

  it("valida o intervalo configurável no fuso de São Paulo", () => {
    expect(validateBusinessDateRange("2026-08-01", "2026-08-25").endExclusive.toISOString()).toBe("2026-08-26T03:00:00.000Z");
    expect(() => validateBusinessDateRange("2026-08-25", "2026-08-01")).toThrow("data inicial");
  });
});
