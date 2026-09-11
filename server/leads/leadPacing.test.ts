import { describe, expect, it } from "vitest";
import { buildLeadPacing } from "./leadPacing";

describe("buildLeadPacing", () => {
  it("calcula realizado, meta, projeção e ritmo necessário para setembro", () => {
    const result = buildLeadPacing({
      period: { start: "2026-09-01", end: "2026-09-10" },
      actual: {
        medsystems: { total: 200, paid: 120 },
        beautysystems: { total: 500, paid: 300 },
      },
    });
    expect(result).toMatchObject({ month: "2026-09", elapsedDays: 10, remainingDays: 20, isMonthToDate: true });
    expect(result.total).toContainEqual(expect.objectContaining({ brand: "medsystems", target: 680, actual: 200 }));
    expect(result.paid).toContainEqual(expect.objectContaining({ brand: "beautysystems", target: 1180, actual: 300 }));
    expect(result.total.at(-1)).toMatchObject({ brand: "consolidado", target: 2130, actual: 700 });
    expect(result.paid.at(-1)).toMatchObject({ brand: "consolidado", target: 1540, actual: 420 });
  });
});
