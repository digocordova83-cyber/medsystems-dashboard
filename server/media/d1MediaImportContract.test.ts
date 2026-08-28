import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { campaignMetricKey } from "./canonicalCampaignRows";

const importer = readFileSync(new URL("../../scripts/reconcile-windsor-media-d1.mjs", import.meta.url), "utf8");

describe("contrato da carga D-1 de mídia", () => {
  it("aceita exclusivamente as quatro contas aprovadas", () => {
    expect(importer).toContain('"446269251699575"');
    expect(importer).toContain('"1655942005167160"');
    expect(importer).toContain('"672-710-7654"');
    expect(importer).toContain('"864-759-2401"');
  });

  it("persiste somente nível campanha com IDs subordinados vazios e upsert", () => {
    expect(importer).toContain("VALUES (?, 'campaign'");
    expect(importer).toContain("'', ''");
    expect(importer).toContain("ON DUPLICATE KEY UPDATE");
  });

  it("mantém a chave canônica independente de marca e nome da campanha", () => {
    const base = {
      platform: "meta_ads",
      accountId: "446269251699575",
      reportDate: new Date("2026-08-27T12:00:00Z"),
      campaignId: "campaign-1",
    };
    expect(campaignMetricKey(base)).toBe("meta_ads|446269251699575|2026-08-27|campaign-1");
  });
});
