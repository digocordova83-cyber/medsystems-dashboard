import { describe, expect, it } from "vitest";
import { dashboardTabFromHash } from "../shared/dashboardTab";

describe("dashboardTabFromHash", () => {
  it("inicia diretamente na aba solicitada sem montar Overview antes", () => {
    expect(dashboardTabFromHash("#bitrix")).toBe("bitrix");
    expect(dashboardTabFromHash("#leads")).toBe("leads");
  });

  it("usa Overview somente para hashes ausentes ou inválidos", () => {
    expect(dashboardTabFromHash("")).toBe("overview");
    expect(dashboardTabFromHash("#inexistente")).toBe("overview");
  });
});
