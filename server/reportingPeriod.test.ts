import { describe, expect, it } from "vitest";
import { currentAnalyticsPeriod, reportingPeriodRange } from "./reportingPeriod";

describe("período mensal do Overview", () => {
  it("usa o mês vigente em Brasília", () => {
    expect(currentAnalyticsPeriod(new Date("2026-09-10T02:30:00.000Z"))).toBe("2026-09");
  });

  it("limita o mês vigente ao último D-1 disponível", () => {
    const range = reportingPeriodRange("2026-09", new Date("2026-09-10T15:00:00.000Z"));
    expect(range.startLabel).toBe("2026-09-01");
    expect(range.endLabel).toBe("2026-09-09");
    expect(range.endExclusiveLabel).toBe("2026-09-10");
  });

  it("mantém meses fechados até o último dia", () => {
    const range = reportingPeriodRange("2026-08", new Date("2026-09-10T15:00:00.000Z"));
    expect(range.endLabel).toBe("2026-08-31");
  });
});
