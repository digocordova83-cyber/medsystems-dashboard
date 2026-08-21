import { describe, expect, it } from "vitest";
import { isInAugust1To20 } from "./service";

describe("isInAugust1To20", () => {
  it("inclui integralmente o dia 20 de agosto no fuso de São Paulo", () => {
    expect(isInAugust1To20("2026-08-01T03:00:00.000Z")).toBe(true);
    expect(isInAugust1To20("2026-08-21T02:59:59.999Z")).toBe(true);
    expect(isInAugust1To20("2026-08-21T03:00:00.000Z")).toBe(false);
  });
});
