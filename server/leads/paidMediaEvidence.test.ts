import { describe, expect, it } from "vitest";
import { buildPaidMediaReferenceIdentities, paidMediaEvidenceKeys, paidUtmEvidence } from "./paidMediaEvidence";

const event = (payload: Record<string, unknown>, identifier = "formulario-mpt") => JSON.stringify({ event_family: "CONVERSION", event_identifier: identifier, payload });

describe("padrão canônico de evidência paga", () => {
  it("aceita UTM paga e rejeita tráfego orgânico", () => {
    expect(paidUtmEvidence(event({ cf_utm_source: "google", cf_utm_medium: "cpc", cf_utm_campaign: "mpt" }))).toBe(true);
    expect(paidUtmEvidence(event({ cf_utm_source: "newsletter", cf_utm_medium: "organic", cf_utm_campaign: "mpt" }))).toBe(false);
  });

  it("normaliza página e formulário para evidência compartilhada", () => {
    expect([...paidMediaEvidenceKeys(event({ cf_landing_page: "https://exemplo.com/mpt/?utm_source=google" }))]).toContain("page:exemplo.com/mpt");
  });

  it("inclui contato por UTM ou página/formulário comprovado no período", () => {
    const references = buildPaidMediaReferenceIdentities({
      events: [
        { accountKey: "medsystems", contactUuid: "a", rawPayload: event({ cf_utm_source: "facebook", cf_utm_medium: "paid_social", cf_utm_campaign: "mpt" }) },
        { accountKey: "medsystems", contactUuid: "b", rawPayload: event({}, "formulario-mpt") },
      ],
      contacts: [
        { accountKey: "medsystems", contactUuid: "a", name: "Ana Silva", email: "ANA@EXEMPLO.COM", phone: "11999990000" },
        { accountKey: "medsystems", contactUuid: "b", name: "Bia Souza", email: null, phone: "11988880000" },
      ],
      identitySecret: "segredo",
    });
    expect(references).toHaveLength(2);
    expect(references.map(row => row.evidence)).toEqual(["paid_utm", "paid_page_or_form"]);
    expect(references.every(row => Boolean(row.identityHash))).toBe(true);
  });
});
