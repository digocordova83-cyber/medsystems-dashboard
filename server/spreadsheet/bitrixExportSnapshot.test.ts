import { describe, expect, it } from "vitest";
import { bitrixExportSnapshot } from "./bitrixExportSnapshot";

const sum = (rows: readonly { count: number }[]) => rows.reduce((total, row) => total + row.count, 0);

describe("bitrixExportSnapshot", () => {
  it("preserva os 2.592 registros da guia Base no recorte informado", () => {
    expect(bitrixExportSnapshot.totalLeads).toBe(2592);
    expect(bitrixExportSnapshot.period).toEqual({ start: "2026-08-01", end: "2026-08-19", days: 19 });
    expect(sum(bitrixExportSnapshot.pipelines)).toBe(bitrixExportSnapshot.totalLeads);
    expect(sum(bitrixExportSnapshot.origins)).toBe(bitrixExportSnapshot.totalLeads);
    expect(sum(bitrixExportSnapshot.stages)).toBe(bitrixExportSnapshot.totalLeads);
  });

  it("mantém BeautySystems associada ao pipeline Negócios e Redes no snapshot da planilha", () => {
    expect(bitrixExportSnapshot.pipelines).toContainEqual({ label: "Negócios e Redes", brand: "BeautySystems", count: 2239 });
    expect(sum(bitrixExportSnapshot.dailyByPipeline.map(row => ({ count: row.medsystems + row.beautysystems })))).toBe(bitrixExportSnapshot.totalLeads);
  });
});
