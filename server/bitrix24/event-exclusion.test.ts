import { describe, expect, it } from "vitest";
import { isBitrixEventLead } from "../db";

describe("isBitrixEventLead", () => {
  it("identifica somente o código estruturado de origem Evento", () => {
    expect(isBitrixEventLead({ SOURCE_ID: "UC_45K0VX" })).toBe(true);
    expect(isBitrixEventLead({ SOURCE_ID: "70" })).toBe(false);
    expect(isBitrixEventLead(null)).toBe(false);
  });
});
