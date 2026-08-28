import { describe, expect, it } from "vitest";
import { publyaDashboardInternals } from "./dashboard";
import { publyaScheduleInternals } from "./scheduled";
import { publyaInternals } from "./service";

function snapshot(campaignId: number, reach: number) {
  return {
    id: campaignId,
    clientId: 810,
    campaignId,
    periodStart: new Date("2026-08-01T03:00:00.000Z"),
    periodEnd: new Date("2026-08-28T02:59:59.000Z"),
    impressions: 610_996,
    reach,
    clicks: 1_077,
    spend: 9_678.046,
    conversions: 0,
    leads: 0,
    ctr: 0.176,
    cpm: 15.84,
    cpc: 8.986,
    viewability: 79.64,
    rawPayload: "{}",
    syncedAt: new Date("2026-08-28T14:00:00.000Z"),
  };
}

describe("integração Publya", () => {
  it("normaliza métricas do schema v2 sem estimar campos ausentes", () => {
    expect(publyaInternals.normalizedMetrics({
      impressions: 1_000,
      reach: 600,
      clicks: 20,
      spend: 75.5,
      ctr: 2,
      conversion: { conversions: 4, leads: 3 },
    })).toMatchObject({ impressions: 1_000, reach: 600, clicks: 20, spend: 75.5, conversions: 4, leads: 3, cpm: 0, viewability: 0 });
  });

  it("mantém apenas as séries diárias efetivamente retornadas pela API", () => {
    const rows = publyaInternals.dailyRows({
      viewability: [{ date: "2026-08-27", value: 79.24 }],
      cpm: [{ date: "2026-08-27", value: 15.84 }],
    });
    expect(rows.get("2026-08-27")).toEqual({ viewability: 79.24, cpm: 15.84 });
    expect(rows.get("2026-08-27")?.impressions).toBeUndefined();
  });

  it("classifica DV360 como programática e exclui Google Ads e Meta", () => {
    expect(publyaDashboardInternals.isProgrammaticPlatform("DV360")).toBe(true);
    expect(publyaDashboardInternals.isProgrammaticPlatform("Display Programmatic")).toBe(true);
    expect(publyaDashboardInternals.isProgrammaticPlatform("Google Ads")).toBe(false);
    expect(publyaDashboardInternals.isProgrammaticPlatform("Meta")).toBe(false);
  });

  it("não soma snapshots com os mesmos totais de entrega", () => {
    const result = publyaDashboardInternals.dedupeSnapshots([snapshot(7059, 169_316), snapshot(7083, 22_116)]);
    expect(result.counted.map(row => row.campaignId)).toEqual([7059]);
    expect(result.duplicates.get(7083)).toBe(7059);
  });

  it("calcula o corte D-1 em Brasília", () => {
    expect(publyaScheduleInternals.previousDayInSaoPaulo(new Date("2026-08-28T14:00:00.000Z"))).toEqual({ startDate: "2026-08-01", endDate: "2026-08-27" });
  });
});
