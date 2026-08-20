import { describe, expect, it } from "vitest";
import { bitrixDealBrand, bitrixDiscardReason, bitrixFinancialStatus, bitrixLeadPipelineBrand, campaignTrackingValue, dealStatusFromSemantic, normalizeCreativeKey, normalizeIdentityEmail, rdEventAttribution, rdEventUtmValues, utmChannelLabel } from "../db";

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

  it("preserva content e term da landing page RD Station quando estão presentes", () => {
    const event = JSON.stringify({ payload: { cf_landing_page: "https://exemplo.com/?utm_source=facebook&utm_campaign=medical-mpt-lp&utm_content=audiencia-quente&utm_term=video-01-mpt" } });
    expect(rdEventUtmValues(event)).toMatchObject({ utmSource: "facebook", utmCampaign: "medical-mpt-lp", utmContent: "audiencia-quente", utmTerm: "video-01-mpt" });
  });

  it("decodifica UTMs no traffic_source codificado enviado pelo RD Station", () => {
    const traffic = Buffer.from(JSON.stringify({
      first_session: { value: "utm_source=facebook&utm_medium=cpc&utm_campaign=bts-mpt-conversao-lp&utm_content=video-03&utm_term=estudos-mpt&utm_id=120238" },
      current_session: { value: "utm_source=facebook&utm_medium=cpc&utm_campaign=bts-mpt-conversao-lp&utm_content=video-03&utm_term=estudos-mpt&utm_id=120238" },
    })).toString("base64");
    const event = JSON.stringify({ payload: { traffic_source: `encoded_${traffic}` } });
    expect(rdEventUtmValues(event)).toEqual({
      utmSource: "facebook",
      utmMedium: "cpc",
      utmCampaign: "bts-mpt-conversao-lp",
      utmContent: "video-03",
      utmTerm: "estudos-mpt",
      mediaCampaignId: "120238",
    });
  });

  it("normaliza e-mail somente quando há uma chave utilizável para o de-para", () => {
    expect(normalizeIdentityEmail("  Lead@Empresa.com.br ")).toBe("lead@empresa.com.br");
    expect(normalizeIdentityEmail("sem-email")).toBeNull();
    expect(normalizeIdentityEmail(null)).toBeNull();
  });

  it("separa as marcas somente pelos valores confirmados no campo Bitrix24", () => {
    expect(bitrixDealBrand({ UF_CRM_1683207237: "1907" })).toBe("medsystems");
    expect(bitrixDealBrand({ UF_CRM_1683207237: "3065" })).toBe("beautysystems");
    expect(bitrixDealBrand({ UF_CRM_1683207237: "outro" })).toBeNull();
  });

  it("aplica o Pipeline de Vendas exportado ao escopo de leads por marca", () => {
    expect(bitrixLeadPipelineBrand({ UF_CRM_1739195085: "15391" })).toBe("medsystems");
    expect(bitrixLeadPipelineBrand({ UF_CRM_1739195085: "15395" })).toBe("beautysystems");
    expect(bitrixLeadPipelineBrand({ UF_CRM_1739195085: "20889" })).toBeNull();
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

  it("normaliza somente o prefixo técnico e a versão numérica de um criativo", () => {
    expect(normalizeCreativeKey("ad04-estatico-05-vectra-bts-03")).toBe("estatico-05-vectra-bts");
    expect(normalizeCreativeKey("video-01-aquapure-bts")).toBe("video-01-aquapure-bts");
    expect(normalizeCreativeKey("undefined")).toBeNull();
  });
});
