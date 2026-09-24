import { describe, expect, it } from "vitest";
import { programmaticDashboard, publyaDashboardInternals } from "./dashboard";
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
    expect(
      publyaInternals.normalizedMetrics({
        impressions: 1_000,
        reach: 600,
        clicks: 20,
        spend: 75.5,
        ctr: 2,
        conversion: { conversions: 4, leads: 3 },
      })
    ).toMatchObject({
      impressions: 1_000,
      reach: 600,
      clicks: 20,
      spend: 75.5,
      conversions: 4,
      leads: 3,
      cpm: 0,
      viewability: 0,
    });
  });

  it("mantém apenas as séries diárias efetivamente retornadas pela API", () => {
    const rows = publyaInternals.dailyRows({
      viewability: [{ date: "2026-08-27", value: 79.24 }],
      cpm: [{ date: "2026-08-27", value: 15.84 }],
    });
    expect(rows.get("2026-08-27")).toEqual({ viewability: 79.24, cpm: 15.84 });
    expect(rows.get("2026-08-27")?.impressions).toBeUndefined();
  });

  it("classifica inventário programático sem confundir Google Ads e Meta", () => {
    expect(publyaDashboardInternals.isProgrammaticPlatform("DV360")).toBe(true);
    expect(
      publyaDashboardInternals.isProgrammaticPlatform("Display Programmatic")
    ).toBe(true);
    expect(publyaDashboardInternals.isProgrammaticPlatform("Google Ads")).toBe(
      false
    );
    expect(publyaDashboardInternals.isProgrammaticPlatform("Meta")).toBe(false);
  });

  it("mapeia os tipos e objetivos dos sete reports mostrados pela Publya", () => {
    expect(
      publyaDashboardInternals.reportMetadata({
        name: "B2B",
        platformName: "Google Ads",
      })
    ).toEqual({ reportType: "PMAX", objective: "Conversões" });
    expect(
      publyaDashboardInternals.reportMetadata({
        name: "B2B",
        platformName: "Meta",
      })
    ).toEqual({ reportType: "Meta", objective: "Geração de Cadastros" });
    expect(
      publyaDashboardInternals.reportMetadata({
        name: "B2B - Geolocalização",
        platformName: "DV360",
      })
    ).toEqual({ reportType: "Programática Display", objective: "Alcance" });
    expect(
      publyaDashboardInternals.reportMetadata({
        name: "B2B",
        platformName: "DV360",
      })
    ).toEqual({ reportType: "Programática Display", objective: "Conversões" });
  });

  it("não soma snapshots com os mesmos totais de entrega", () => {
    const result = publyaDashboardInternals.dedupeSnapshots([
      snapshot(7059, 169_316),
      snapshot(7083, 22_116),
    ]);
    expect(result.counted).toHaveLength(1);
    expect(result.duplicates.size).toBe(1);
    expect(
      result.duplicates.get(7059) ?? result.duplicates.get(7083)
    ).toBeTruthy();
  });

  it("considera cada report somente quando sua vigência cruza o período", () => {
    expect(
      publyaDashboardInternals.campaignOverlapsPeriod(
        {
          startDate: new Date("2026-09-02T03:00:00.000Z"),
          endDate: new Date("2026-09-30T02:59:59.000Z"),
        },
        new Date("2026-08-01T03:00:00.000Z"),
        new Date("2026-08-31T02:59:59.000Z")
      )
    ).toBe(false);
    expect(
      publyaDashboardInternals.campaignOverlapsPeriod(
        {
          startDate: new Date("2026-09-02T03:00:00.000Z"),
          endDate: new Date("2026-09-30T02:59:59.000Z"),
        },
        new Date("2026-09-01T03:00:00.000Z"),
        new Date("2026-09-23T02:59:59.000Z")
      )
    ).toBe(true);
  });

  it("calcula o corte D-1 em Brasília", () => {
    expect(
      publyaScheduleInternals.previousDayInSaoPaulo(
        new Date("2026-08-28T14:00:00.000Z")
      )
    ).toEqual({ startDate: "2026-08-01", endDate: "2026-08-27" });
  });

  it("entrega o overview dos relatórios configurados sem inflar o snapshot DV360 duplicado", async () => {
    const data = await programmaticDashboard({
      startDate: "2026-08-01",
      endDate: "2026-08-27",
    });
    expect(data.campaigns).toHaveLength(4);
    expect(data.push?.reportType).toBe("Push Notification");
    expect(data.reportOptions.length).toBeGreaterThanOrEqual(
      data.campaigns.length + (data.push ? 1 : 0)
    );
    expect(
      new Set(data.reportOptions.map(option => option.reportKey)).size
    ).toBe(data.reportOptions.length);
    expect(
      data.campaigns.map(row => `${row.reportType}:${row.objective}`)
    ).toEqual(
      expect.arrayContaining([
        "PMAX:Conversões",
        "Meta:Geração de Cadastros",
        "Programática Display:Alcance",
        "Programática Display:Conversões",
      ])
    );
    expect(data.campaigns.filter(row => !row.counted)).toHaveLength(1);
    const countedCampaigns = data.campaigns.filter(row => row.counted);
    expect(data.totals.spend).toBeCloseTo(
      countedCampaigns.reduce((sum, row) => sum + row.spend, 0) +
        (data.push?.spend ?? 0),
      6
    );
    expect(data.totals.impressions).toBe(
      countedCampaigns.reduce((sum, row) => sum + row.impressions, 0)
    );
    expect(data.totals.sends).toBe(data.push?.sends ?? 0);
    expect(data.totals.clicks).toBe(
      countedCampaigns.reduce((sum, row) => sum + row.clicks, 0) +
        (data.push?.clicks ?? 0)
    );
    expect(data.totals.pushClicks).toBe(data.push?.clicks ?? 0);
    expect(data.campaigns.every(row => Boolean(row.reportUrl))).toBe(true);
  });

  it("filtra Push e campanha individual sem misturar os resultados", async () => {
    const push = await programmaticDashboard({
      startDate: "2026-08-01",
      endDate: "2026-08-27",
      reportKey: "push:medsystems/b2b/xr50xt2cwdhc",
    });
    expect(push.campaigns).toHaveLength(0);
    expect(push.push?.sends).toBeGreaterThan(0);
    expect(push.totals.sends).toBe(push.push?.sends ?? 0);
    expect(push.totals.spend).toBeCloseTo(push.push?.spend ?? 0, 6);
    expect(push.totals.clicks).toBe(push.push?.clicks ?? 0);

    const pmax = await programmaticDashboard({
      startDate: "2026-08-01",
      endDate: "2026-08-27",
      reportKey: "campaign:7058",
    });
    expect(pmax.push).toBeNull();
    expect(pmax.campaigns).toHaveLength(1);
    expect(pmax.campaigns[0]?.reportType).toBe("PMAX");
    expect(
      pmax.reportOptions.some(
        option => option.reportKey === "push:medsystems/b2b/xr50xt2cwdhc"
      )
    ).toBe(true);
  });

  it("exibe os três reports iniciados em setembro com links oficiais", async () => {
    const september = await programmaticDashboard({
      startDate: "2026-09-01",
      endDate: "2026-09-23",
    });
    expect(september.campaigns.map(row => row.campaignId)).toEqual(
      expect.arrayContaining([7144, 7145, 7292])
    );
    expect(september.campaigns).toHaveLength(3);
    expect(september.campaigns.every(row => Boolean(row.reportUrl))).toBe(true);
  });

  it("expõe métricas e rankings específicos para Meta, PMAX, Display e Push", async () => {
    const meta = await programmaticDashboard({
      startDate: "2026-08-01",
      endDate: "2026-08-27",
      reportKey: "campaign:7069",
    });
    expect(meta.campaigns[0]?.leads).toBeGreaterThan(0);
    expect(meta.campaigns[0]?.reach).toBeGreaterThan(0);
    expect(meta.states.length).toBeGreaterThan(0);

    const pmax = await programmaticDashboard({
      startDate: "2026-08-01",
      endDate: "2026-08-27",
      reportKey: "campaign:7058",
    });
    expect(pmax.devices.length).toBeGreaterThan(0);
    expect(pmax.cities.length).toBeGreaterThan(0);

    const display = await programmaticDashboard({
      startDate: "2026-08-01",
      endDate: "2026-08-27",
      reportKey: "campaign:7083",
    });
    expect(display.campaigns[0]?.frequency).toBeGreaterThan(0);
    expect(display.sites.length).toBeGreaterThan(0);
    expect(display.formats.length).toBeGreaterThan(0);
    expect(display.creatives.length).toBeGreaterThan(0);
    expect(display.strategies.length).toBeGreaterThan(0);

    const push = await programmaticDashboard({
      startDate: "2026-08-01",
      endDate: "2026-08-27",
      reportKey: "push:medsystems/b2b/xr50xt2cwdhc",
    });
    expect(push.byDay.some(row => row.sends > 0)).toBe(true);
    expect(push.totals.pushCtr).toBeGreaterThan(0);
  });
});
