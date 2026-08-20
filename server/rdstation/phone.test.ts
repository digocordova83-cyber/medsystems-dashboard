import { describe, expect, it } from "vitest";
import { normalizeIdentityPhone, rdEventUtmValues } from "../db";
import { rdPhoneFromContactDetail } from "./service";

describe("hidratação de telefone RD Station", () => {
  it("prioriza o telefone explícito do contato", () => {
    expect(rdPhoneFromContactDetail({ phone: "+55 (11) 99999-0000" })).toBe("+55 (11) 99999-0000");
  });

  it("aceita telefones devolvidos na lista estruturada", () => {
    expect(rdPhoneFromContactDetail({ phones: [{ number: "11988887777" }] })).toBe("11988887777");
  });

  it("mantém ausência de telefone explícita", () => {
    expect(rdPhoneFromContactDetail({ email: "contato@exemplo.com" })).toBeNull();
  });

  it("normaliza formatos nacionais e internacionais para uma chave comparável", () => {
    expect(normalizeIdentityPhone("(11) 98888-7777")).toBe("5511988887777");
    expect(normalizeIdentityPhone("+55 11 98888-7777")).toBe("5511988887777");
  });

  it("extrai source, medium e campanha de traffic_source codificado", () => {
    const source = Buffer.from(JSON.stringify({ current_session: { value: "utm_source=facebook&utm_medium=cpc&utm_campaign=campanha_teste" } })).toString("base64");
    const values = rdEventUtmValues(JSON.stringify({ payload: { traffic_source: `encoded_${source}` } }));
    expect(values).toMatchObject({ utmSource: "facebook", utmMedium: "cpc", utmCampaign: "campanha_teste" });
  });
});
