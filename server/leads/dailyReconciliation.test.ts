import { describe, expect, it } from "vitest";
import { previousBusinessDayInSaoPaulo } from "./dailyReconciliation";

describe("conciliação diária de mídia paga", () => {
  it("calcula D-1 no fuso de São Paulo", () => {
    expect(previousBusinessDayInSaoPaulo(new Date("2026-09-02T12:00:00.000Z"))).toBe("2026-09-01");
  });

  it("respeita a virada local antes da meia-noite em Brasília", () => {
    expect(previousBusinessDayInSaoPaulo(new Date("2026-09-02T02:30:00.000Z"))).toBe("2026-08-31");
  });
});
