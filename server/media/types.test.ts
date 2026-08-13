import { describe, expect, it } from "vitest";
import { cpl, roas, safeRatio } from "./types";

describe("métricas de mídia", () => {
  it("evita divisão por zero em métricas de eficiência", () => {
    expect(safeRatio(10, 0)).toBe(0);
    expect(cpl(500, 0)).toBe(0);
    expect(roas(0, 100)).toBe(0);
  });

  it("calcula CPL e ROAS a partir de dados reais", () => {
    expect(cpl(500, 25)).toBe(20);
    expect(roas(1500, 500)).toBe(3);
  });
});
