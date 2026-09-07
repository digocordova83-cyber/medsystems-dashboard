import { describe, expect, it } from "vitest";
import { saoPauloBusinessDate } from "../db";

describe("saoPauloBusinessDate", () => {
  it("preserva os limites configurados no fuso de Brasília", () => {
    expect(saoPauloBusinessDate(new Date("2026-09-01T00:00:00-03:00"))).toBe("2026-09-01");
    expect(saoPauloBusinessDate(new Date("2026-09-07T00:00:00-03:00"))).toBe("2026-09-07");
  });

  it("classifica corretamente a madrugada do portal dentro do D-1 brasileiro", () => {
    expect(saoPauloBusinessDate("2026-09-07T02:58:00+03:00")).toBe("2026-09-06");
    expect(saoPauloBusinessDate("2026-09-07T06:00:00+03:00")).toBe("2026-09-07");
  });

  it("rejeita datas inválidas", () => {
    expect(() => saoPauloBusinessDate("data-inválida")).toThrow(/inválida/);
  });
});
