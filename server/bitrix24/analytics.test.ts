import { describe, expect, it } from "vitest";
import { bitrixDealBrand, bitrixDiscardReason, bitrixFinancialStatus, campaignTrackingValue, dealStatusFromSemantic, rdEventAttribution, utmChannelLabel } from "../db";

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
    expect(utmChannelLabel("undefined")).toBe("Não identificado");
  });

  it("extrai UTMs e ID de campanha de um evento RD Station com landing page", () => {
    const event = JSON.stringify({ payload: { cf_landing_page: "https://exemplo.com/?utm_source=facebook&utm_campaign=medical-mpt-conversao-lp&utm_id=120241115063950326" } });
    expect(rdEventAttribution(event)).toEqual({ utmSource: "facebook", utmCampaign: "medical-mpt-conversao-lp", mediaCampaignId: "120241115063950326" });
  });

  it("separa as marcas somente pelos valores confirmados no campo Bitrix24", () => {
    expect(bitrixDealBrand({ UF_CRM_1683207237: "1907" })).toBe("medsystems");
    expect(bitrixDealBrand({ UF_CRM_1683207237: "3065" })).toBe("beautysystems");
    expect(bitrixDealBrand({ UF_CRM_1683207237: "outro" })).toBeNull();
  });

  it("usa somente códigos confirmados para rotular motivos de descarte", () => {
    expect(bitrixDiscardReason({ UF_CRM_1687285902: "7429" })).toBe("Duplicado");
    expect(bitrixDiscardReason({ UF_CRM_1687285902: "2277" })).toBe("Venda Cancelada");
    expect(bitrixDiscardReason({ UF_CRM_1687285902: "desconhecido" })).toBeNull();
  });

  it("mantém o status financeiro em uma dimensão própria", () => {
    expect(bitrixFinancialStatus({ UF_CRM_1769707203: "20393" })).toBe("Aprovado Medsystems");
    expect(bitrixFinancialStatus({ UF_CRM_1769707203: "20395" })).toBe("Recusada");
    expect(bitrixFinancialStatus({ UF_CRM_1769707203: "desconhecido" })).toBeNull();
  });

  it("prioriza identificadores UTM explícitos sem promover valores ausentes a campanha", () => {
    expect(campaignTrackingValue({ UTM_CAMPAIGN: "campanha-verificada", UTM_TERM: "criativo" })).toEqual({ field: "UTM campaign", value: "campanha-verificada" });
    expect(campaignTrackingValue({ UTM_CAMPAIGN: "null", UTM_TERM: "criativo" })).toEqual({ field: "UTM term", value: "criativo" });
    expect(campaignTrackingValue({ UTM_CONTENT: "undefined" })).toBeNull();
  });
});
