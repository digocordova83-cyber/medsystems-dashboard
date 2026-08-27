import { describe, expect, it } from "vitest";
import { dedupeCanonicalCampaignRows, sumCampaignMetrics, type CampaignMetricRow } from "./canonicalCampaignRows";

function row(input: Partial<CampaignMetricRow> & Pick<CampaignMetricRow, "id" | "campaignId" | "spend" | "syncedAt">): CampaignMetricRow {
  return {
    platform: "meta_ads",
    brand: "medsystems",
    accountId: "account-1",
    reportDate: new Date("2026-08-01T12:00:00.000Z"),
    campaignName: "Campanha",
    impressions: 100,
    clicks: 10,
    leads: 2,
    ...input,
  };
}

describe("linhas canônicas de mídia", () => {
  it("mantém somente a carga mais recente por plataforma, conta, data e campanha", () => {
    const rows = dedupeCanonicalCampaignRows([
      row({ id: 1, campaignId: "campaign-1", spend: 100, syncedAt: new Date("2026-08-20T10:00:00Z") }),
      row({ id: 2, campaignId: "campaign-1", spend: 120, syncedAt: new Date("2026-08-21T10:00:00Z") }),
      row({ id: 3, campaignId: "campaign-2", spend: 50, syncedAt: new Date("2026-08-21T10:00:00Z") }),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows.find(item => item.campaignId === "campaign-1")?.spend).toBe(120);
  });

  it("soma somente as métricas recebidas após a deduplicação", () => {
    const canonical = dedupeCanonicalCampaignRows([
      row({ id: 1, campaignId: "campaign-1", spend: 100, syncedAt: new Date("2026-08-20T10:00:00Z") }),
      row({ id: 2, campaignId: "campaign-1", spend: 120, syncedAt: new Date("2026-08-21T10:00:00Z") }),
      row({ id: 3, campaignId: "campaign-2", spend: 50, syncedAt: new Date("2026-08-21T10:00:00Z") }),
    ]);
    expect(sumCampaignMetrics(canonical).spend).toBe(170);
  });
});
