import { describe, expect, it } from "vitest";
import { META_ACTIVE_AD_IDS, META_ACTIVE_STATUS_AS_OF } from "./metaActiveAdsSnapshot";
import { validateMediaDateRange } from "./channelDashboard";

describe("painéis gerenciais de mídia", () => {
  it("aceita intervalo inclusivo e converte o fim para limite exclusivo", () => {
    const range = validateMediaDateRange("2026-08-01", "2026-08-19");
    expect(range.start.toISOString()).toBe("2026-08-01T03:00:00.000Z");
    expect(range.endExclusive.toISOString()).toBe("2026-08-20T03:00:00.000Z");
  });

  it("rejeita intervalo invertido", () => {
    expect(() => validateMediaDateRange("2026-08-20", "2026-08-01")).toThrow("data inicial");
  });

  it("mantém um snapshot Meta explícito e não vazio", () => {
    expect(META_ACTIVE_STATUS_AS_OF).toBe("2026-08-20");
    expect(META_ACTIVE_AD_IDS.size).toBe(128);
  });
});
