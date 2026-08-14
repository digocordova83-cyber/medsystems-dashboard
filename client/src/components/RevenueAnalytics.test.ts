import { describe, expect, it } from "vitest";
import { DASHBOARD_TABS, SUPPORTED_REPORTING_PERIODS, dashboardMath } from "./RevenueAnalytics";

describe("dashboardMath.ratio", () => {
  it("calcula CPL, custo por venda e ROAS preservando precisão", () => {
    expect(dashboardMath.ratio(28_119.38, 552)).toBeCloseTo(50.94, 2);
    expect(dashboardMath.ratio(28_119.38, 134)).toBeCloseTo(209.85, 2);
    expect(dashboardMath.ratio(31_500_000, 28_119.38)).toBeGreaterThan(1_000);
  });

  it("retorna zero quando a base de divisão não possui registros", () => {
    expect(dashboardMath.ratio(5_000, 0)).toBe(0);
  });

  it("mantém Revenue como a única visão comercial central", () => {
    expect(DASHBOARD_TABS.map(tab => tab.id)).toEqual(["overview", "google", "meta", "revenue"]);
  });

  it("mantém agosto e julho como períodos explícitos de análise", () => {
    expect(SUPPORTED_REPORTING_PERIODS).toEqual(["2026-08", "2026-07"]);
  });
});
