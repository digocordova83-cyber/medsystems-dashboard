import { describe, expect, it } from "vitest";
import { buildLeadReconciliation } from "./reconciliation";

describe("buildLeadReconciliation", () => {
  it("separa volume de conversões, contatos únicos e origem desconhecida", () => {
    const result = buildLeadReconciliation([
      { accountKey: "medsystems", convertedAt: new Date("2026-09-01T12:00:00Z"), identityHash: "med-1", channel: "meta_ads", utmSource: "facebook", utmCampaign: "campanha-med", conversionEvent: "cotacao-med", rdContactUuid: "rd-med-1" },
      { accountKey: "medsystems", convertedAt: new Date("2026-09-01T18:00:00Z"), identityHash: "med-1", channel: "unknown", utmSource: null, utmCampaign: null, conversionEvent: "cotacao-med", rdContactUuid: "rd-med-1" },
      { accountKey: "beautysystems", convertedAt: new Date("2026-09-02T01:00:00Z"), identityHash: "beauty-1", channel: "google_ads", utmSource: "google", utmCampaign: "campanha-beauty", conversionEvent: "cotacao-beauty", rdContactUuid: "rd-beauty-1" },
    ], [
      { businessDate: "2026-09-01", accountKey: "medsystems", sourceLabel: "Gestor", reportedLeads: 1, note: null },
      { businessDate: "2026-09-01", accountKey: "beautysystems", sourceLabel: "Gestor", reportedLeads: 1, note: null },
    ]);

    expect(result.totals).toMatchObject({ sourceVolume: 3, uniqueContacts: 2, rdMatchedContacts: 2, identifiedSource: 2, unknownSource: 1, managerReported: 2 });
    expect(result.byBrand.find(row => row.accountKey === "medsystems")).toMatchObject({ sourceVolume: 2, uniqueContacts: 1, identifiedSource: 1, unknownSource: 1, managerReported: 1, differenceToManager: 1 });
    expect(result.byBrand.find(row => row.accountKey === "beautysystems")).toMatchObject({ sourceVolume: 1, uniqueContacts: 1, identifiedSource: 1, unknownSource: 0, managerReported: 1, differenceToManager: 0 });
    expect(result.byDay).toEqual([{ date: "2026-09-01", total: 3, medsystems: 2, beautysystems: 1 }]);
  });

  it("mantém campanhas e eventos agregados por BU sem reatribuir pela nomenclatura", () => {
    const result = buildLeadReconciliation([
      { accountKey: "medsystems", convertedAt: new Date("2026-09-01T12:00:00Z"), identityHash: "med-1", channel: "meta_ads", utmSource: "facebook", utmCampaign: "bts-campanha", conversionEvent: "cotacao-vectra", rdContactUuid: null },
      { accountKey: "medsystems", convertedAt: new Date("2026-09-01T13:00:00Z"), identityHash: "med-2", channel: "meta_ads", utmSource: "facebook", utmCampaign: "bts-campanha", conversionEvent: "cotacao-vectra", rdContactUuid: null },
    ], []);

    expect(result.campaigns[0]).toMatchObject({ label: "bts-campanha", brand: "medsystems", count: 2, uniqueContacts: 2 });
    expect(result.conversionEvents[0]).toMatchObject({ label: "cotacao-vectra", brand: "medsystems", count: 2 });
    expect(result.totals.managerReported).toBeNull();
  });
});
