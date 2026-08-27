import { describe, expect, it } from "vitest";
import { isInAugustThroughD1 } from "./service";

describe("isInAugustThroughD1", () => {
  it("inclui agosto até o início do dia atual em São Paulo", () => {
    expect(isInAugustThroughD1("2026-08-01T03:00:00.000Z")).toBe(true);
    expect(isInAugustThroughD1("2026-08-27T02:59:59.999Z")).toBe(true);
    expect(isInAugustThroughD1("2026-08-27T03:00:00.000Z")).toBe(false);
  });
});
