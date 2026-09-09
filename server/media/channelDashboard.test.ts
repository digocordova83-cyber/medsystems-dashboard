import { describe, expect, it } from "vitest";
import { deriveCreativeMetrics, validateMediaDateRange } from "./channelDashboard";

describe("painéis gerenciais de mídia", () => {
  it("aceita intervalo inclusivo e converte o fim para limite exclusivo", () => {
    const range = validateMediaDateRange("2026-08-01", "2026-08-19");
    expect(range.start.toISOString()).toBe("2026-08-01T03:00:00.000Z");
    expect(range.endExclusive.toISOString()).toBe("2026-08-20T03:00:00.000Z");
  });

  it("rejeita intervalo invertido", () => {
    expect(() => validateMediaDateRange("2026-08-20", "2026-08-01")).toThrow("data inicial");
  });

  it("calcula CPL e CTR no nível de anúncio", () => {
    expect(deriveCreativeMetrics({ spend: "250", leads: "5", impressions: "1000", clicks: "40" })).toEqual({
      spend: 250,
      leads: 5,
      impressions: 1000,
      clicks: 40,
      cpl: 50,
      ctr: 4,
    });
  });

  it("mantém CPL e CTR indisponíveis quando não há denominador", () => {
    expect(deriveCreativeMetrics({ spend: 80, leads: 0, impressions: 0, clicks: 0 })).toMatchObject({ cpl: null, ctr: null });
  });
});
