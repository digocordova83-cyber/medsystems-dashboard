import { describe, expect, it } from "vitest";
import { dealStatusFromSemantic, utmChannelLabel } from "../db";

describe("classificação comercial auditável", () => {
  it("preserva os significados de estágio do Bitrix24", () => {
    expect(dealStatusFromSemantic("S")).toBe("won");
    expect(dealStatusFromSemantic("F")).toBe("lost");
    expect(dealStatusFromSemantic("")).toBe("open");
  });

  it("classifica UTM somente quando o canal está explicitamente informado", () => {
    expect(utmChannelLabel("google")).toBe("Google Ads");
    expect(utmChannelLabel("facebook")).toBe("Meta Ads");
    expect(utmChannelLabel("APP")).toBe("Não identificado");
  });
});
