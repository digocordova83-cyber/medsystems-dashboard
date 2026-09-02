import { describe, expect, it } from "vitest";
import { isInAugustThroughD1, isInConversionWindow } from "./service";

describe("isInAugustThroughD1", () => {
  it("inclui agosto até o fechamento do mês em São Paulo", () => {
    expect(isInAugustThroughD1("2026-08-01T03:00:00.000Z")).toBe(true);
    expect(isInAugustThroughD1("2026-09-01T02:59:59.999Z")).toBe(true);
    expect(isInAugustThroughD1("2026-09-01T03:00:00.000Z")).toBe(false);
  });
});

describe("isInConversionWindow", () => {
  it("inclui o início e exclui o fim da janela informada", () => {
    const start = new Date("2026-09-01T03:00:00.000Z");
    const end = new Date("2026-09-02T03:00:00.000Z");
    expect(isInConversionWindow("2026-09-01T03:00:00.000Z", start, end)).toBe(true);
    expect(isInConversionWindow("2026-09-02T02:59:59.999Z", start, end)).toBe(true);
    expect(isInConversionWindow("2026-09-02T03:00:00.000Z", start, end)).toBe(false);
    expect(isInConversionWindow("inválido", start, end)).toBe(false);
  });
});
