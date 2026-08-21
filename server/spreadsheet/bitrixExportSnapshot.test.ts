import { describe, expect, it } from "vitest";
import { bitrixExportSnapshot } from "./bitrixExportSnapshot";

const sum = (rows: readonly { count: number }[]) => rows.reduce((total, row) => total + row.count, 0);

describe("bitrixExportSnapshot", () => {
  it("preserva o recorte da guia Base após retirar os registros de Evento", () => {
    expect(bitrixExportSnapshot.eventExclusion).toEqual({ field: "Fonte", label: "Evento", excluded: 1591, remaining: 1001 });
    expect(bitrixExportSnapshot.period).toEqual({ start: "2026-08-01", end: "2026-08-19", days: 19 });
    expect(sum(bitrixExportSnapshot.scopes.all.pipelines)).toBe(bitrixExportSnapshot.scopes.all.totalLeads);
    expect(sum(bitrixExportSnapshot.scopes.all.origins)).toBe(bitrixExportSnapshot.scopes.all.totalLeads);
    expect(sum(bitrixExportSnapshot.scopes.all.stages)).toBe(bitrixExportSnapshot.scopes.all.totalLeads);
  });

  it("separa Medsystems e BeautySystems no filtro local da planilha", () => {
    expect(bitrixExportSnapshot.scopes.beautysystems.pipelines).toContainEqual({ label: "Negócios e Redes", brand: "BeautySystems", count: 648 });
    expect(bitrixExportSnapshot.scopes.medsystems.totalLeads).toBe(353);
    expect(sum(bitrixExportSnapshot.scopes.all.dailyByPipeline.map(row => ({ count: row.medsystems + row.beautysystems })))).toBe(bitrixExportSnapshot.scopes.all.totalLeads);
  });
});
