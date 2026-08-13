import { describe, expect, it } from "vitest";
import { isInJuly2026, isRdAccountKey } from "./types";

describe("regras de conta e período", () => {
  it("aceita somente as duas contas configuradas", () => {
    expect(isRdAccountKey("medsystems")).toBe(true);
    expect(isRdAccountKey("beautysystems")).toBe(true);
    expect(isRdAccountKey("outra-conta")).toBe(false);
  });

  it("mantém apenas eventos de julho de 2026", () => {
    expect(isInJuly2026("2026-07-01T00:00:00.000Z")).toBe(true);
    expect(isInJuly2026("2026-07-31T23:59:59.000Z")).toBe(true);
    expect(isInJuly2026("2026-06-30T23:59:59.000Z")).toBe(false);
    expect(isInJuly2026("2026-08-01T00:00:00.000Z")).toBe(false);
  });
});
